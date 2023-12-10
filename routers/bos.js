const express = require('express');
const Order = require('../controller/v1/order');

const router = express.Router();

router.get('/orders/count', Order.getOrderCount);

module.exports = router;