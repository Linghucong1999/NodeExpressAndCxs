const StatisModel = require('../../models/statis/static.js');
const UserInfoModel = require('../../models/v2/userinfo.js');
const OrderModel = require('../../models/bos/order.js');
const AdminModel = require('../../models/admin/admin.js');

//相关api请求次数
class Statis {
    constructor() {

    }

    async apiCount(req, res, next) {
        const date = req.params.data;
        if (!date) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '参数错误'
            })
            return
        }

        try {
            const count = await StatisModel.find({ date }).count();
            res.send({
                status: 1,
                count,
                message: date

            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_GET_TODAY_API_COUNT',
                message: '获取当天的api请求量次数失败'
            })
        }

    }

    async apiAllcount(req, res, next) {
        try {
            const count = await StatisModel.count();
            res.send({
                status: 1,
                count
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_GET_ALL_API_COUNT',
                message: '获取所有api请求次数失败'
            })
        }
    }

    async allApiRecord(req, res, next) {
        try {
            const allRecord = await StatisModel.find({}, { _id: 0, __v: 0 });
            res.send(allRecord);
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_GET_ALL_RECORDS',
                message: '获取所有API请求信息失败'
            })
        }
    }

    async userCount(req, res, next) {
        const data = req.params.data;
        if (!data) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '参数错误'
            })
            return
        }

        try {
            const count = await UserInfoModel.find({ registe_time: eval('/^' + data + '/gi') }).count();
            res.send({
                status: 1,
                count
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_GET_USER_REGISTE_COUNT',
                message: '获取当天注册的人数失败'
            })
        }
    }

    async adminCount(req, res, next) {
        const data = req.params.data;
        if (!data) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '参数错误'
            })
            return
        }

        try {
            const count = await AdminModel.find({ creat_time: eval('/^' + data + '/gi') }).count();
            res.send({
                status: 1,
                count,
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_GET_ADMIN_REGISTE_COUNT',
                message: '获取当天注册管理员人数失败'
            })
        }
    }

    async orderCount(req, res, next) {
        const data = req.params.data;
        if (!data) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '参数错误'
            })
            return
        }

        try {
            const count = await OrderModel.find({ formatted_created_at: eval('/^' + data + '/gi') }).count()
            res.send({
                status: 1,
                count
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_GET_ORDER_COUNT',
                message: '获取当天订单数量失败'
            })
        }
    }


}

module.exports = new Statis();