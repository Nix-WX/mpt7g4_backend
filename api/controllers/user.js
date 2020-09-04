const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const errorHandler = require('../util/errorHandler');

const User = require('../models/user');
const History = require('../models/history');
const Shop = require('../models/shop');
const { history_checkIn } = require('./history');


exports.user_getAll = (req, res, next) => {
    User.find()
    .then(users => {
        res.status(200).json({
            message: 'Users returned successfully',
            data: users
        });
    })
    .catch(err => errorHandler(res, err));
};


exports.user_signup = (req, res, next) => {
    User.findOne({ phone: req.body.phone })
    .then(user => {
        if(user) {
            return res.status(409).json({
                error: {
                    message: 'User already exists.'
                }
            });
        }
        else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err) {
                    return errorHandler(res, err);
                }
                else {
                    const user = new User({
                        phone: req.body.phone,
                        password: hash,
                        name: req.body.name,
                        gender: req.body.gender,
                        status: req.body.status
                    });

                    user.save()
                    .then(result => {
                        const token = jwt.sign({ _id: result._id, phone: result.phone }, process.env.JWT_KEY, { expiresIn: "1h" });

                        return res.status(200).json({
                            message: 'User created successfully',
                            data: {
                                user: {
                                    _id: result._id, 
                                    phone: result.phone,
                                    name: result.name,
                                    gender: result.gender,
                                    status: result.status
                                },
                                token: token
                            }
                        });
                    })
                    .catch(err => errorHandler(res, err));
                }
            });
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.user_login = (req, res, next) => {
    User.findOne({ phone: req.body.phone })
    .then(user => {
        if(!user) {
            return res.status(401).json({
                error: {
                    message: 'Invalid phone or password.'
                }
            });
        }

        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if(err) {
                return res.status(401).json({
                    error: {
                        message: 'Invalid phone or password.'
                    }
                });
            }

            if(result) {
                const token = jwt.sign({ _id: user._id, phone: user.phone }, process.env.JWT_KEY, { expiresIn: "1h" });

                return res.status(200).json({
                    message: 'Authentication successful',
                    data: {
                        user: {
                            _id: user._id,
                            phone: user.phone,
                            name: user.name,
                            gender: user.gender,
                            status: user.status
                        },
                        token: token
                    }
                });
            }

            return res.status(401).json({
                error: {
                    message: 'Invalid phone or password.'
                }
            });
        });
    })
    .catch(err => errorHandler(res, err));
};


exports.user_update = (req, res, next) => {
    User.findById(req.params.userId)
    .then(user => {
        if(!user) {
            return res.status(404).json({
                error: {
                    message: 'User not found'
                }
            });
        }
        else {
            if(req.body.password) {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if(err) {
                        return errorHandler(res, err);
                    }
                    else {
                        User.findByIdAndUpdate(req.params.userId, { 
                            phone: req.body.phone ? req.body.phone : user.phone,
                            password: hash ? hash : user.password,
                            name: req.body.name ? req.body.name : user.name,
                            gender: req.body.gender ? req.body.gender : user.gender,
                            status: req.body.status ? req.body.status : user.status
                        }, { new: true, runValidators: true })
                        .then(result => {
                            res.status(200).json({
                                message: 'User updated successfully',
                                data: {
                                    user: {
                                        _id: result._id,
                                        phone: result.phone,
                                        name: result.name,
                                        gender: result.gender,
                                        status: result.status
                                    }
                                }
                            });
                        })
                        .catch(err => errorHandler(res, err));
                    }
                });
            }
            else {
                User.findByIdAndUpdate(req.params.userId, { 
                    phone: req.body.phone ? req.body.phone : user.phone,
                    name: req.body.name ? req.body.name : user.name,
                    gender: req.body.gender ? req.body.gender : user.gender,
                    status: req.body.status ? req.body.status : user.status
                }, { new: true, runValidators: true })
                .then(result => {
                    res.status(200).json({
                        message: 'User updated successfully',
                        data: {
                            user: {
                                _id: result._id,
                                phone: result.phone,
                                name: result.name,
                                gender: result.gender,
                                status: result.status
                            }
                        }
                    });
                })
                .catch(err => errorHandler(res, err));
            }
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.user_diagnosed = (req, res, next) => {
    User.findById(req.body.userId)
    .then(user => {
        if(!user) {
            res.status(404).json({
                error: {
                    message: 'User not found'
                }
            });
        }
        else {
            User.findByIdAndUpdate(req.body.userId, { status: 'Diagnosed' }, { new: true, runValidators: true })
            .then(updatedUser => {
                var fortnightAgo = new Date(Date.now() - 12096e5);

                History.find({ user: req.body.userId, checkIn: { $gte: fortnightAgo } })
                .then(histories => {
                    const query = histories.map(history => {
                        return {
                            shop: history.shop,
                            checkIn: { 
                                $gte: new Date(history.checkIn.getFullYear(), history.checkIn.getMonth(), history.checkIn.getDate(), 0, 0, 0),
                                $lte: new Date(history.checkIn.getFullYear(), history.checkIn.getMonth(), history.checkIn.getDate() + 1, 0, 0, 0)
                            }
                        }
                    });

                    History.find({ $and: [ { user: { $ne: req.body.userId } } , { $or: query }] })
                    .then(involvedHistories => {
                        const userIdQuery = involvedHistories.map(history => {
                            return { _id: history.user }
                        });

                        User.updateMany({ $or: userIdQuery }, { $set: { status: 'High' } })
                        .then(result => {
                            res.status(200).json({
                                message: 'Affected user updated successfully'
                            });
                        })
                        .catch(err => errorHandler(res, err));
                    })
                    .catch(err => errorHandler(res, err));

                })
                .catch(err => errorHandler(res, err));

            })
            .catch(err => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.user_startup = (req, res, next) => {
    User.deleteMany();
    History.deleteMany();

    const user1 = new User({
        phone: '',
        password: '',
        name: '',
        gender: '',
        status: 'Low'
    });
};