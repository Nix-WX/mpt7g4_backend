const jwt = require('jsonwebtoken');
const errorHandler = require('../util/errorHandler');

const User = require('../models/user');
const History = require('../models/history');
const DailyStatus = require('../models/dailystatus');

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


exports.user_getUserByPhone = (req, res, next) => {
    User.findOne({ phone: req.params.phone })
    .then(user => {
        res.status(200).json({
            message: 'User returned successfully',
            data: user
        });
    })
    .catch(err => errorHandler(res, err));
};


exports.user_getAffectedUsers = (req, res, next) => {
    User.findOne({ phone: req.params.phone })
    .then(user => {
        if(!user) {
            res.status(404).json({
                error: {
                    message: 'User not found'
                }
            });
        }
        else {
            var fortnightAgo = new Date(Date.now() - 12096e5);

            History.find({ user: user._id, checkIn: { $gte: fortnightAgo } })
            .then(histories => {
                if(histories.length <= 0) {
                    return res.status(200).json({
                        message: 'No Affected User',
                        data: []
                    });
                }

                const query = histories.map(history => {
                    return {
                        shop: history.shop,
                        checkIn: { 
                            $gte: new Date(history.checkIn.getFullYear(), history.checkIn.getMonth(), history.checkIn.getDate(), 0, 0, 0),
                            $lte: new Date(history.checkIn.getFullYear(), history.checkIn.getMonth(), history.checkIn.getDate() + 1, 0, 0, 0)
                        }
                    }
                });
                
                let affectedUsersAdded = {};
                let affectedUsers = [];
                
                History.find({ $and: [ { user: { $ne: user._id } } , { $or: query }] })
                .then(involvedHistories => {
                    involvedHistories.map(history => {
                        if(!affectedUsersAdded[history.user]) {
                            affectedUsersAdded[history.user] = true;
                            affectedUsers.push({ user: history.user });
                        }

                        return { _id: history.user }
                    });

                    User.populate(affectedUsers, { path: 'user' }, (err, populated_result) => {
                        if(err) return errorHandler(res, err);

                        res.status(200).json({
                            message: 'Affected user returned successfully',
                            data: populated_result.map(el => el.user)
                        });
                    });
                })
                .catch(err => errorHandler(res, err));

            })
            .catch(err => errorHandler(res, err));
        }
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
            const user = new User({
                phone: req.body.phone,
                password: req.body.password,
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

        if(user.password === req.body.password) {
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
        else {
            return res.status(401).json({
                error: {
                    message: 'Invalid phone or password.'
                }
            });
        }
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
            User.findOne({ phone: req.body.phone })
            .then((newPhoneUser) => {
                if(newPhoneUser && !newPhoneUser._id.equals(req.params.userId)) {
                    return res.status(409).json({
                        error: {
                            message: 'Phone number already in use.'
                        }
                    });
                }
                else {
                    User.findByIdAndUpdate(req.params.userId, { 
                        phone: req.body.phone ? req.body.phone : user.phone,
                        password: req.body.password ? req.body.password : user.password,
                        name: req.body.name ? req.body.name : user.name,
                        gender: req.body.gender ? req.body.gender : user.gender,
                        status: req.body.status ? req.body.status : user.status
                    }, { new: true, runValidators: true })
                    .then(result => {
                        if(req.body.status && user.status === "Diagnosed" && req.body.status !== user.status) {
                            DailyStatus.findOneAndUpdate({ date: new Date().toLocaleDateString() }, { $inc: { recovered : 1 } }, { upsert: true })
                            .then(updated => {
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
                        else {
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
                        }
                    })
                    .catch(err => errorHandler(res, err));
                }
            })
            .catch((err) => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.user_diagnosed = (req, res, next) => {
    User.findById(req.body.userId)
    .then(user => {
        if(!user) {
            return res.status(404).json({
                error: {
                    message: 'User not found'
                }
            });
        }
        else {
            if(user.status === 'Diagnosed') {
                return res.status(409).json({
                    error: { 
                        message: 'User already diagnosed'
                    }
                });
            }
            
            User.findByIdAndUpdate(req.body.userId, { status: 'Diagnosed' }, { new: true, runValidators: true })
            .then(updatedUser => {

                DailyStatus.findOneAndUpdate({ date: new Date().toLocaleDateString() }, { $inc: { diagnosed : 1 } }, { upsert: true })
                .then(updated => {

                    var fortnightAgo = new Date(Date.now() - 12096e5);

                    History.find({ user: req.body.userId, checkIn: { $gte: fortnightAgo } })
                    .then(histories => {
                        if(histories.length <= 0) {
                            return res.status(200).json({
                                message: 'No Affected User'
                            });
                        }

                        let returnArr = {};

                        const query = histories.map(history => {
                            returnArr[history.shop] = [];

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
                                returnArr[history.shop].push(history.user);
    
                                return { _id: history.user  }
                            });

                            User.updateMany({ $and: [ { $or: userIdQuery }, { status: { $ne: 'Diagnosed' } } ] }, { $set: { status: 'High' } })
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
            })
            .catch(err => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.user_recovered = (req, res, next) => {
    User.findById(req.body.userId)
    .then(user => {
        if(!user) {
            return res.status(404).json({
                error: {
                    message: 'User not found'
                }
            });
        }
        else {
            if(user.status === 'Low') {
                return res.status(409).json({
                    error: { 
                        message: 'User already recovered / not detected'
                    }
                });
            }
            
            User.findByIdAndUpdate(req.body.userId, { status: 'Low' }, { new : true, runValidators: true})
            .then(updatedUser => {

                if(user.status === 'High') {
                    return res.status(200).json({
                        message: 'User updated successfully',
                        data: {
                            user: {
                                _id: updatedUser._id,
                                phone: updatedUser.phone,
                                name: updatedUser.name,
                                gender: updatedUser.gender,
                                status: updatedUser.status
                            }
                        }
                    });
                }

                DailyStatus.findOneAndUpdate({ date: new Date().toLocaleDateString() }, { $inc: { recovered : 1 } }, { upsert: true })
                .then(updated => {
                    res.status(200).json({
                        message: 'User updated successfully',
                        data: {
                            user: {
                                _id: updatedUser._id,
                                phone: updatedUser.phone,
                                name: updatedUser.name,
                                gender: updatedUser.gender,
                                status: updatedUser.status
                            }
                        }
                    });
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