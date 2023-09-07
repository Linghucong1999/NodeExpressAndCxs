const express = require('express');
const Statis = require('../controller/statis/statis.js');

const router = express.Router();

router.get('/api/:data/count', Statis.apiCount);
router.get('/api/count', Statis.apiAllcount);
router.get('/api/all', Statis.allApiRecord);
router.get('/user/:data/count', Statis.userCount);
router.get('/admin/:data/count', Statis.adminCount);
router.get('/order/:data/count', Statis.orderCount);

module.exports = router;