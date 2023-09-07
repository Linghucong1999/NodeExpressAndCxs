const express = require('express');
const Shop = require('../controller/shopping/shop.js');
const Category = require('../controller/shopping/category.js');
const Check = require('../middlewares/check');

const router = express.Router();

router.post('/addshop', Check.checkAdmin, Shop.addShop);
router.get('/restaurants', Shop.getRestaurants);
router.get('/v2/restaurant/category', Category.getCategories);

module.exports = router;
