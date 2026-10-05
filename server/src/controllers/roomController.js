const db = require('../db');
const { broadcastRoomUpdated } = require('../socket/socketHandler');

function getSlots(req, res) {
  const slots = db.prepare('SELECT * FROM slots ORDER BY slot_order ASC').all();
  return res.json({ success: true, slots });
}

function getRooms(req, res) {
  const { date, slot_id, floor, capacity_min, capacity_max, search, status, only_available } = req.query;

  let query = 'SELECT * FROM rooms WHERE 1=1';
  const params = [];

  if (floor) {
    query += ' AND floor = ?';
    params.push(Number(floor));
  }

  if (capacity_min) {
    query += ' AND capacity >= ?';
    params.push(Number(capacity_min));
  }

  if (capacity_max) {
    query += ' AND capacity <= ?';
    params.push(Number(capacity_max));
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search && search.trim() !== '') {
    query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY floor ASC, id ASC';

  const rooms = db.prepare(query).all(...params);

  // If date and slot_id are provided, determine availability per room
  if (date && slot_id) {
    const activeBookings = db.prepare(`
      SELECT b.id AS booking_id, b.room_id, b.user_id, u.name AS user_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.booking_date = ? AND b.slot_id = ? AND b.status = 'CONFIRMED'
    `).all(date, Number(slot_id));

    const bookingMap = new Map();
    activeBookings.forEach(b => {
      bookingMap.set(b.room_id, b);
    });

    const enrichedRooms = rooms.map(room => {
      const isMaintenance = room.status === 'MAINTENANCE';
      const booking = bookingMap.get(room.id);
      const isBooked = !!booking;

      return {
        ...room,
        is_booked: isBooked,
        is_maintenance: isMaintenance,
        is_available: !isMaintenance && !isBooked,
        current_booking: booking ? {
          booking_id: booking.booking_id,
          booked_by_user_id: booking.user_id,
          booked_by_name: booking.user_name,
        } : null
      };
    });

    if (only_available === 'true') {
      return res.json({
        success: true,
        rooms: enrichedRooms.filter(r => r.is_available)
      });
    }

    return res.json({ success: true, rooms: enrichedRooms });
  }

  // If no slot specified, attach today's slots count or return standard rooms
  return res.json({ success: true, rooms });
}

function getRoomSchedule(req, res) {
  const roomId = Number(req.params.id);
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy phòng học.' });
  }

  const slots = db.prepare('SELECT * FROM slots ORDER BY slot_order ASC').all();
  const bookings = db.prepare(`
    SELECT b.id, b.slot_id, b.user_id, u.name as user_name, b.status
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.room_id = ? AND b.booking_date = ? AND b.status = 'CONFIRMED'
  `).all(roomId, date);

  const bookedSlotsMap = new Map();
  bookings.forEach(b => bookedSlotsMap.set(b.slot_id, b));

  const schedule = slots.map(slot => {
    const booking = bookedSlotsMap.get(slot.id);
    return {
      ...slot,
      is_available: room.status !== 'MAINTENANCE' && !booking,
      booking: booking ? {
        id: booking.id,
        user_name: booking.user_name,
        user_id: booking.user_id
      } : null
    };
  });

  return res.json({
    success: true,
    room,
    date,
    schedule
  });
}

function createRoom(req, res) {
  const { name, code, floor, capacity, image_url, description, status } = req.body;

  if (!name || !code || !floor || !capacity) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên phòng, mã phòng, tầng và sức chứa.' });
  }

  const existing = db.prepare('SELECT id FROM rooms WHERE code = ?').get(code.trim().toUpperCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Mã phòng này đã tồn tại!' });
  }

  const defaultImg = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80';

  const result = db.prepare(`
    INSERT INTO rooms (name, code, floor, capacity, image_url, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    code.trim().toUpperCase(),
    Number(floor),
    Number(capacity),
    image_url && image_url.trim() ? image_url.trim() : defaultImg,
    description || '',
    status || 'AVAILABLE'
  );

  const newRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);
  broadcastRoomUpdated({ action: 'CREATED', room: newRoom });

  return res.status(201).json({
    success: true,
    message: 'Tạo phòng học thành công!',
    room: newRoom
  });
}

function updateRoom(req, res) {
  const roomId = Number(req.params.id);
  const { name, code, floor, capacity, image_url, description, status } = req.body;

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy phòng học.' });
  }

  if (code && code.trim().toUpperCase() !== room.code) {
    const existing = db.prepare('SELECT id FROM rooms WHERE code = ? AND id != ?').get(code.trim().toUpperCase(), roomId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mã phòng này đã trùng với một phòng khác!' });
    }
  }

  db.prepare(`
    UPDATE rooms
    SET name = COALESCE(?, name),
        code = COALESCE(?, code),
        floor = COALESCE(?, floor),
        capacity = COALESCE(?, capacity),
        image_url = COALESCE(?, image_url),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
    WHERE id = ?
  `).run(
    name ? name.trim() : null,
    code ? code.trim().toUpperCase() : null,
    floor ? Number(floor) : null,
    capacity ? Number(capacity) : null,
    image_url ? image_url.trim() : null,
    description !== undefined ? description : null,
    status || null,
    roomId
  );

  const updatedRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  broadcastRoomUpdated({ action: 'UPDATED', room: updatedRoom });

  return res.json({
    success: true,
    message: 'Cập nhật phòng học thành công!',
    room: updatedRoom
  });
}

function deleteRoom(req, res) {
  const roomId = Number(req.params.id);

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy phòng học.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const activeBookings = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE room_id = ? AND booking_date >= ? AND status = 'CONFIRMED'
  `).get(roomId, today);

  if (activeBookings.count > 0) {
    return res.status(400).json({
      success: false,
      message: `Không thể xóa phòng này vì đang có ${activeBookings.count} lịch đặt phòng chưa diễn ra. Bạn có thể chuyển phòng sang trạng thái 'Bảo trì'.`
    });
  }

  db.prepare('DELETE FROM bookings WHERE room_id = ?').run(roomId);
  db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);

  broadcastRoomUpdated({ action: 'DELETED', roomId });

  return res.json({
    success: true,
    message: 'Đã xóa phòng học thành công!'
  });
}

module.exports = {
  getSlots,
  getRooms,
  getRoomSchedule,
  createRoom,
  updateRoom,
  deleteRoom
};
