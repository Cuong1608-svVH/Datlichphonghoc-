const db = require('../db');
const { broadcastRoomStatusChange } = require('../socket/socketHandler');

/**
 * Checks if a slot time has already passed for a given date.
 */
function isSlotInThePast(bookingDate, startTimeStr) {
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const slotDate = new Date(`${bookingDate}T${startTimeStr}:00`);
  const now = new Date();
  return slotDate.getTime() <= now.getTime();
}

/**
 * Calculates remaining hours before a booking starts.
 */
function getHoursUntilBooking(bookingDate, startTimeStr) {
  const slotDate = new Date(`${bookingDate}T${startTimeStr}:00`);
  const now = new Date();
  return (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
}

/**
 * Atomic Transaction for booking a room.
 * Resolves concurrency conflicts by:
 * 1. Synchronously locking and checking active booking in SQLite WAL mode.
 * 2. UNIQUE constraint on (room_id, booking_date, slot_id) WHERE status = 'CONFIRMED'.
 */
const executeBookingTransaction = db.transaction((userId, roomId, bookingDate, slotId, notes) => {
  // Check if room is available
  const room = db.prepare('SELECT id, status, name FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    const err = new Error('Phòng học không tồn tại.');
    err.code = 'ROOM_NOT_FOUND';
    throw err;
  }
  if (room.status === 'MAINTENANCE') {
    const err = new Error('Phòng học hiện đang trong quá trình bảo trì.');
    err.code = 'ROOM_IN_MAINTENANCE';
    throw err;
  }

  // Check if slot already booked
  const existing = db.prepare(`
    SELECT id, user_id FROM bookings
    WHERE room_id = ? AND booking_date = ? AND slot_id = ? AND status = 'CONFIRMED'
  `).get(roomId, bookingDate, slotId);

  if (existing) {
    const err = new Error('Rất tiếc! Phòng và khung giờ này vừa có người khác đặt trước bạn.');
    err.code = 'SLOT_ALREADY_BOOKED';
    throw err;
  }

  // Insert confirmed booking
  const result = db.prepare(`
    INSERT INTO bookings (user_id, room_id, booking_date, slot_id, status, notes)
    VALUES (?, ?, ?, ?, 'CONFIRMED', ?)
  `).run(userId, roomId, bookingDate, slotId, notes || null);

  return result.lastInsertRowid;
});

function bookRoom(req, res) {
  const userId = req.user.id;
  const { room_id, booking_date, slot_id, notes } = req.body;

  if (!room_id || !booking_date || !slot_id) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng chọn đầy đủ phòng học, ngày đặt và ca học.'
    });
  }

  // 1. Verify slot exists
  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(Number(slot_id));
  if (!slot) {
    return res.status(400).json({ success: false, message: 'Ca học không hợp lệ.' });
  }

  // 2. Prevent past bookings
  const todayStr = new Date().toISOString().split('T')[0];
  if (booking_date < todayStr) {
    return res.status(400).json({ success: false, message: 'Không thể đặt phòng cho ngày đã qua trong quá khứ.' });
  }
  if (booking_date === todayStr && isSlotInThePast(booking_date, slot.start_time)) {
    return res.status(400).json({ success: false, message: 'Ca học này đã bắt đầu hoặc đã kết thúc trong ngày hôm nay.' });
  }

  // 3. User limit rule: Max 3 active bookings per day per student
  const userBookingsToday = db.prepare(`
    SELECT COUNT(*) as count FROM bookings
    WHERE user_id = ? AND booking_date = ? AND status = 'CONFIRMED'
  `).get(userId, booking_date);

  if (userBookingsToday.count >= 3) {
    return res.status(400).json({
      success: false,
      message: 'Bạn đã đạt giới hạn tối đa 3 ca học trong ngày này! Vui lòng chọn ngày khác hoặc nhường cho các bạn sinh viên khác.'
    });
  }

  // 4. Execute atomic transaction (Handles Concurrency Conflict)
  try {
    const bookingId = executeBookingTransaction(
      userId,
      Number(room_id),
      booking_date,
      Number(slot_id),
      notes ? notes.trim() : ''
    );

    // Retrieve full booking info
    const newBooking = db.prepare(`
      SELECT b.*, r.name as room_name, r.code as room_code, r.floor, r.capacity, r.image_url,
             s.name as slot_name, s.start_time, s.end_time, u.name as user_name, u.email as user_email
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN slots s ON b.slot_id = s.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(bookingId);

    // Broadcast Realtime Update via WebSocket to all connected users
    broadcastRoomStatusChange({
      action: 'BOOKED',
      roomId: Number(room_id),
      bookingDate: booking_date,
      slotId: Number(slot_id),
      status: 'BOOKED',
      bookingId,
      bookedBy: req.user.name,
      bookedByUserId: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Đặt phòng học thành công!',
      booking: newBooking
    });
  } catch (err) {
    console.error('Booking conflict or error:', err.message);

    // Handle race condition conflict gracefully
    if (err.code === 'SLOT_ALREADY_BOOKED' || err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_CONFLICT',
        message: 'Rất tiếc! Phòng và khung giờ này vừa có người hoàn tất đặt trước bạn vài giây. Danh sách phòng đã được tự động cập nhật lại.'
      });
    }

    if (err.code === 'ROOM_IN_MAINTENANCE' || err.code === 'ROOM_NOT_FOUND') {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra trong quá trình đặt phòng. Vui lòng thử lại.'
    });
  }
}

function cancelBooking(req, res) {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';
  const bookingId = Number(req.params.id);

  const booking = db.prepare(`
    SELECT b.*, s.start_time, s.end_time, r.name as room_name
    FROM bookings b
    JOIN slots s ON b.slot_id = s.id
    JOIN rooms r ON b.room_id = r.id
    WHERE b.id = ?
  `).get(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin đặt phòng.' });
  }

  if (booking.status === 'CANCELLED') {
    return res.status(400).json({ success: false, message: 'Lịch đặt phòng này đã được hủy trước đó.' });
  }

  // Authorization check
  if (!isAdmin && booking.user_id !== userId) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy lịch đặt phòng của người khác.' });
  }

  // 3-Hour Cancellation Rule for students
  if (!isAdmin) {
    const hoursRemaining = getHoursUntilBooking(booking.booking_date, booking.start_time);
    if (hoursRemaining < 3) {
      return res.status(400).json({
        success: false,
        message: `Theo quy định, bạn chỉ được phép hủy phòng trước giờ bắt đầu tối thiểu 3 tiếng (hiện chỉ còn ${hoursRemaining.toFixed(1)} tiếng hoặc đã qua ca học). Vui lòng liên hệ Quản trị viên nếu có trường hợp đột xuất.`
      });
    }
  }

  // Perform cancellation in DB
  db.prepare(`
    UPDATE bookings
    SET status = 'CANCELLED',
        cancelled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(bookingId);

  // Broadcast Realtime Update via WebSocket: Room is now AVAILABLE again
  broadcastRoomStatusChange({
    action: 'CANCELLED',
    roomId: booking.room_id,
    bookingDate: booking.booking_date,
    slotId: booking.slot_id,
    status: 'AVAILABLE',
    cancelledBookingId: bookingId
  });

  return res.json({
    success: true,
    message: 'Hủy đặt phòng thành công! Khung giờ này đã được mở lại cho sinh viên khác.'
  });
}

function getUserBookings(req, res) {
  const userId = req.user.id;

  const bookings = db.prepare(`
    SELECT b.*,
           r.name as room_name, r.code as room_code, r.floor, r.capacity, r.image_url,
           s.name as slot_name, s.start_time, s.end_time
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN slots s ON b.slot_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC, s.slot_order ASC, b.id DESC
  `).all(userId);

  const enrichedBookings = bookings.map(b => {
    const hoursRemaining = getHoursUntilBooking(b.booking_date, b.start_time);
    const isPast = hoursRemaining <= 0;
    const canCancel = b.status === 'CONFIRMED' && hoursRemaining >= 3;

    return {
      ...b,
      hours_remaining: hoursRemaining,
      is_past: isPast,
      can_cancel: canCancel
    };
  });

  return res.json({
    success: true,
    bookings: enrichedBookings
  });
}

function getAllBookings(req, res) {
  const { date, room_id, status, search } = req.query;

  let query = `
    SELECT b.*,
           r.name as room_name, r.code as room_code, r.floor, r.capacity, r.image_url,
           s.name as slot_name, s.start_time, s.end_time,
           u.name as user_name, u.email as user_email, u.student_id, u.department, u.phone
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN slots s ON b.slot_id = s.id
    JOIN users u ON b.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    query += ' AND b.booking_date = ?';
    params.push(date);
  }

  if (room_id) {
    query += ' AND b.room_id = ?';
    params.push(Number(room_id));
  }

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }

  if (search && search.trim() !== '') {
    query += ' AND (u.name LIKE ? OR u.student_id LIKE ? OR u.email LIKE ? OR r.name LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY b.booking_date DESC, s.slot_order ASC, b.id DESC';

  const bookings = db.prepare(query).all(...params);

  return res.json({
    success: true,
    bookings
  });
}

module.exports = {
  bookRoom,
  cancelBooking,
  getUserBookings,
  getAllBookings
};
