const errorHandler = require('../util/errorHandler');

const Shop = require('../models/shop');

exports.shop_getAll = (req, res, next) => {
    Shop.find()
    .then(shops => {
        res.status(200).json({
            message: 'Shops returned successfully',
            data: shops
        });
    })
    .catch(err => errorHandler(res, err));
};


exports.shop_get = (req, res, next) => {
    Shop.findById(req.params.shopId)
    .then(shop => {
        res.status(200).json({
            message: 'Shop returned successfully',
            data: shop
        });
    })
    .catch(err => errorHandler(res, err));
};


exports.shop_create = (req, res, next) => {
    Shop.findOne({ phone: req.body.phone })
    .then(shop => {
        if(shop) {
            return res.status(409).json({
                error: {
                    message: 'Shop already exists'
                }
            });
        }
        else {
            const shop = new Shop({
                name: req.body.name,
                phone: req.body.phone,
                location: req.body.location
            });

            shop.save()
            .then(result => {
                res.status(200).json({
                    message: 'Shop created successfully',
                    shop: {
                        _id: result._id,
                        name: result.name,
                        phone: result.phone,
                        location: result.location
                    }
                });
            })
            .catch(err => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
};

exports.shop_update = (req, res, next) => {
    Shop.findById(req.params.shopId)
    .then(shop => {
        if(!shop) {
            return res.status(404).json({
                error: {   
                    message: 'Shop not exists'
                }
            });
        }
        else {
            Shop.updateOne({ _id: req.params.shopId }, { $set: req.body })
            .then(result => {
                res.status(200).json({
                    message: 'Shop updated successfully'
                });
            })
            .catch(err => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
};


exports.shop_delete = (req, res, next) => {
    Shop.findById(req.params.shopId)
    .then(shop => {
        if(!shop) {
            return res.status(404).json({
                error: {   
                    message: 'Shop not exists'
                }
            });
        }
        else {
            Shop.deleteOne({ _id: req.params.shopId })
            .then(result => {
                res.status(200).json({
                    message: 'Shop deleted successfully'
                });
            })
            .catch(err => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
};