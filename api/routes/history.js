const express = require('express');
const router = express.Router();

const HistoryController = require('../controllers/history');
const authenticate = require('../util/authenticate');

router.get('/', authenticate, HistoryController.history_getAll);

router.get('/active', authenticate, HistoryController.history_getActive);

router.get('/:userId', authenticate, HistoryController.history_getUserHistory);

router.get('/:userId/:historyId', authenticate, HistoryController.history_getHistory);

router.post('/', authenticate, HistoryController.history_checkIn);

router.post('/:historyId', authenticate, HistoryController.history_checkOut);

router.delete('/', authenticate, HistoryController.history_deleteAll);

module.exports = router;