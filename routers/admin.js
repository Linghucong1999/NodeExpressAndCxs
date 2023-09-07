const express = require('express');
const AdminAxios = require('../controller/admin/admindata.js')
const router = express.Router();

router.post('/login', AdminAxios.login);
router.get('/singout', AdminAxios.singout);
router.get('/all', AdminAxios.getAlladmin);
router.get('/count', AdminAxios.getAdminCount);
router.get('/info', AdminAxios.getAdminInfo);
router.post('/updata/avatar/:admin_id', AdminAxios.updataAvatar);
router.get('/conditionget/admin', AdminAxios.conditionGetAdmin);



module.exports = router;
