const express = require('express');
const Order = require('../controller/v1/order');

const router = express.Router();

router.get('/orders/count', Order.getOrderCount);
router.get('/orders', Order.getOrderList);
router.get('/orders/keywords', Order.getOrderListBykeyWord);

module.exports = router;