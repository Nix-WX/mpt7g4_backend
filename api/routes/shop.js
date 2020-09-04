const express = require('express');
const router = express.Router();

const ShopController = require('../controllers/shop');

router.get('/', ShopController.shop_getAll);

router.get('/:shopId', ShopController.shop_get);

router.post('/', ShopController.shop_create);

router.post('/:shopId', ShopController.shop_update);

router.delete('/:shopId', ShopController.shop_delete);

module.exports = router;