const express = require('express');

const Captchas = require('../controller/v1/captchas.js');
const User = require('../controller/v2/user.js');
const CityHandle = require('../controller/v1/cities.js');
const SearchPlace = require("../controller/v1/search.js");

const router = express.Router();

router.post('/captchas', Captchas.getCaptchas);

router.get('/user', User.getInfo);
router.get('/user/:user_id', User.getInfoById);
router.get('/users/list', User.getUserList);
router.get('/users/count', User.getUserCount);
router.get('/user/city/count', User.getUserCity);
router.get('/user/condition/userlist', User.conditionGetUser);
router.get('/cities', CityHandle.getCity);
router.get('/cities/:id', CityHandle.getCityById);
router.get('/exactaddress', CityHandle.getExactAddress);
router.get('/pois',SearchPlace.search);
module.exports = router;