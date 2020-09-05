const express = require('express');
const router = express.Router();

const DailyStatusController = require('../controllers/dailystatus');

router.get('/', DailyStatusController.dailyStatus_getToday);

module.exports = router;