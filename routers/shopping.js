const express = require('express');
const Shop = require('../controller/shopping/shop.js');
const Category = require('../controller/shopping/category.js');
const Food = require('../controller/shopping/food.js');
const Check = require('../middlewares/check');

const router = express.Router();

router.post('/addshop', Check.checkAdmin, Shop.addShop);
router.get('/restaurants', Shop.getRestaurants);
router.get('/restaurant/:restaurant_id', Shop.getRestaurantDetail);
router.get('/restaurants/count', Shop.getShopCount);

router.get('/getCategory/:restaurant_id', Food.getCategory);

router.get('/v2/restaurant/category', Category.getCategories);

router.delete('/restaurant/:restaurant_id', Shop.deleteResturant);
module.exports = router;
