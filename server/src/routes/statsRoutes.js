const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/statsController');
const { requireAdmin } = require('../middleware/auth');

router.get('/dashboard', requireAdmin, getDashboardStats);

module.exports = router;
