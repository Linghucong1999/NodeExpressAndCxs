//修改用户头像

const express = require('express');
const User = require('../controller/v2/user.js');

const router = express.Router();

router.post('/v1/users/:user_id/avatar', User.updataAvatar);


module.exports = router;