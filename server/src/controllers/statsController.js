const db = require('../db');

function getDashboardStats(req, res) {
  const today = new Date().toISOString().split('T')[0];

  // Room counts
  const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  const availableRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'AVAILABLE'").get().count;
  const maintenanceRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'MAINTENANCE'").get().count;

  // Bookings today
  const todayBookings = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
    FROM bookings
    WHERE booking_date = ?
  `).get(today);

  // All time bookings
  const allTimeBookings = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
    FROM bookings
  `).get();

  // Top 5 popular rooms
  const topRooms = db.prepare(`
    SELECT r.id, r.name, r.code, r.floor, r.capacity, COUNT(b.id) as booking_count
    FROM rooms r
    LEFT JOIN bookings b ON r.id = b.room_id AND b.status = 'CONFIRMED'
    GROUP BY r.id
    ORDER BY booking_count DESC
    LIMIT 5
  `).all();

  // Floor stats
  const floorStats = db.prepare(`
    SELECT floor, COUNT(*) as count
    FROM rooms
    GROUP BY floor
    ORDER BY floor ASC
  `).all();

  return res.json({
    success: true,
    stats: {
      rooms: {
        total: totalRooms,
        available: availableRooms,
        maintenance: maintenanceRooms
      },
      today: {
        total: todayBookings.total || 0,
        confirmed: todayBookings.confirmed || 0,
        cancelled: todayBookings.cancelled || 0
      },
      allTime: {
        total: allTimeBookings.total || 0,
        confirmed: allTimeBookings.confirmed || 0,
        cancelled: allTimeBookings.cancelled || 0
      },
      topRooms,
      floorStats
    }
  });
}

module.exports = {
  getDashboardStats
};
