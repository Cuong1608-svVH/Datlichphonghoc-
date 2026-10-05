const express = require('express');
const router = express.Router();
const {
  bookRoom,
  cancelBooking,
  getUserBookings,
  getAllBookings
} = require('../controllers/bookingController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/', requireAuth, bookRoom);
router.put('/:id/cancel', requireAuth, cancelBooking);
router.get('/my', requireAuth, getUserBookings);
router.get('/admin/all', requireAdmin, getAllBookings);

module.exports = router;
