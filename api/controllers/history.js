const errorHandler = require('../util/errorHandler');

const User = require('../models/user');
const Shop = require('../models/shop');
const History = require('../models/history');
const e = require('express');

exports.history_getAll = (req, res, next) => {
    History.find()
    .then(histories => {
        res.status(200).json({
            message: 'Histories returned successfully',
            data: histories
        });
    })
    .catch(err => errorHandler(res, err));
};


exports.history_getUserHistory = (req, res, next) => {
    History.find({ user: req.params.userId })
    .populate('shop')
    .then(histories => {
        res.status(200).json({
            message: 'Histories returned successfully',
            data: histories
        });
    })
    .catch(err => errorHandler(res, err));
};


exports.history_getActive = (req, res, next) => {
    History.find({ checkOut: null })
    .select('shop')
    .populate('shop')
    .then(histories => {
        var data = {};
        
        histories.map(history => {
            if(data[history.shop._id]) {
                data[history.shop._id] = {
                    ...data[history.shop._id],
                    number: data[history.shop._id].number + 1
                }
            }
            else {
                data[history.shop._id] = {
                    _id: history.shop._id,
                    name: history.shop.name,
                    phone: history.shop.phone,
                    location: history.shop.location,
                    number: 1
                }
            }
        });

        res.status(200).json({
            messsage: 'Active users returned successfully',
            data: Object.keys(data).map(shopId => {
                return data[shopId];
            })
        });
    })
    .catch(err => errorHandler(res, err));
};


exports.history_getHistory = (req, res, next) => {
    History.findById(req.params.historyId)
    .populate('shop')
    .then(history => {
        if(!history) {
            return res.status(404).json({
                error: {
                    message: "History not found"
                }
            });
        }
        else {
            res.status(200).json({
                message: 'History detailed returned successfully',
                data: {
                    _id: history._id,
                    user: history.user,
                    shop: history.shop,
                    checkIn: history.checkIn,
                    checkOut: history.checkOut
                }
            });
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.history_checkIn = (req, res, next) => {
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
            Shop.findById(req.body.shopId)
            .then(shop => {
                if(!shop) {
                    return res.status(404).json({
                        error: {
                            message: 'Shop not found'
                        }
                    });
                }
                else {
                    const history = new History({
                        user: req.body.userId,
                        shop: req.body.shopId
                    });
                
                    history.save()
                    .then(result => {
                        Shop.populate(result, { path: 'shop' }, (err, populated_result) => {
                            res.status(200).json({
                                message: 'Checked in successfully',
                                data: {
                                    _id: result._id,
                                    user: result.user,
                                    shop: result.shop,
                                    checkIn: result.checkIn,
                                    checkOut: result.checkOut
                                }
                            });
                        });
                    })
                    .catch(err => errorHandler(res, err));
                }
            })
            .catch(err => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.history_checkOut = (req, res, next) => {
    History.findById(req.params.historyId)
    .then(history => {
        if(!history) {
            return res.status(404).json({
                error: {
                    message: 'History not found'
                }
            });
        }
        else if(history.checkOut) {
            return res.status(409).json({
                error: {
                    message: 'Already checked out'
                }
            });
        }
        else {
            History.findByIdAndUpdate(req.params.historyId, { $set: { checkOut: new Date() } }, { new: true, runValidators: true })
            .populate('shop')
            .then(result => {
                res.status(200).json({
                    message: 'Checked out successfully',
                    data: {
                        _id: result._id,
                        user: result.user,
                        shop: result.shop,
                        checkIn: result.checkIn,
                        checkOut: result.checkOut
                    }
                });
            })
            .catch(err => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.history_deleteAll = (req, res, next) => {
    History.deleteMany()
    .then(result => {
        res.status(200).json({
            message: 'Histories deleted successfully'
        });
    })
    .catch(err => errorHandler(res, err));
};