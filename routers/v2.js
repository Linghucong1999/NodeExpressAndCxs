const express = require('express');
const User = require('../controller/v2/user.js');
const Entry = require('../controller/v2/entry.js');
const UserSearch = require('../controller/v2/userseach');
const router = express.Router();

router.post('/login', User.login);
router.get('/signout', User.signout);
router.post('/user/changepassword', User.changePassword);
router.get('/index_entry', Entry.getEntry);
router.get('/categorydatalist', UserSearch.addSearchFood);
router.get('/categorydatalist/search', UserSearch.searchTotal)

module.exports = router;