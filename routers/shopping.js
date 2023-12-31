const express = require('express');
const Shop = require('../controller/shopping/shop.js');
const Category = require('../controller/shopping/category.js');
const Food = require('../controller/shopping/food.js');
const Check = require('../middlewares/check');

const router = express.Router();

router.post('/addshop', Check.checkAdmin, Shop.addShop);
router.post('/updatashop', Check.checkAdmin, Shop.updatashop);
router.get('/restaurants', Shop.getRestaurants);
router.get('/restaurant/:restaurant_id', Shop.getRestaurantDetail);
router.get('/restaurants/count', Shop.getShopCount);
router.get('/restaurants/searchshop', Shop.searchShop);
router.get('/restaurants/getrestaurantnamedetail', Shop.getRestaurantNameDetail);

router.get('/getCategory/:restaurant_id', Food.getCategory);
router.post('/addcategory', Check.checkAdmin, Food.addCategory);
router.post('/addfood', Check.checkAdmin, Food.addFood);
router.get('/food/searchfood', Food.searchFood);
router.get('/v2/getfoods', Food.getFoods);
router.get('/v2/foods/count', Food.getFoodsCount);
router.get('/v2/menu/:category_id', Food.getMenuDetail);
router.get('/v2/menu', Food.getMenu);
router.delete('/v2/food/:food_id', Check.checkSuperAdmin, Food.deleteFood);
router.post('/v2/updatafood', Check.checkAdmin, Food.updataFood);

router.get('/v2/restaurant/category', Category.getCategories);

router.delete('/restaurant/:restaurant_id', Shop.deleteResturant);
module.exports = router;
