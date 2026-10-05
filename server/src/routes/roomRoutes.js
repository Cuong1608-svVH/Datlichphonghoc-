const express = require('express');
const router = express.Router();
const {
  getSlots,
  getRooms,
  getRoomSchedule,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');
const { requireAdmin } = require('../middleware/auth');

router.get('/slots', getSlots);
router.get('/', getRooms);
router.get('/:id/schedule', getRoomSchedule);

// Admin-only management
router.post('/', requireAdmin, createRoom);
router.put('/:id', requireAdmin, updateRoom);
router.delete('/:id', requireAdmin, deleteRoom);

module.exports = router;
