const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user');

router.get('/', UserController.user_getAll);

router.get('/searchByPhone/:phone', UserController.user_getUserByPhone);

router.get('/getAffectedUser/:userId', UserController.user_getAffectedUsers);

router.post('/signup', UserController.user_signup);

router.post('/login', UserController.user_login);

router.post('/diagnosed', UserController.user_diagnosed);

router.post('/recovered', UserController.user_recovered);

router.post('/:userId', UserController.user_update);

module.exports = router;