const express = require('express');
const FindCity = require('../controller/findCityRes/findCity');

const router = express.Router();

router.get('/citydistrict', FindCity.getFindCity);
router.get('/citychilder', FindCity.getLowerCity);
module.exports = router;