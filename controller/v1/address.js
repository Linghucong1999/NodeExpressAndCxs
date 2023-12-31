const BaseComponent = require('../../prototype/baseComponent');
const AddressModel = require('../../models/v1/address');


class Address extends BaseComponent {
    constructor() {
        super();

    }

    //通过用户id获取用户订单地址
    async getAddress(req, res, next) {
        const user_id = req.params.user_id;

        if (!user_id || !Number(user_id)) {
            res.send({
                type: 'ERROR_USER_ID',
                message: 'user_id参数错误',
            })
            return;
        }

        try {
            const addressList = await AddressModel.find({ user_id }, { _id: 0 });
            res.send(addressList);
        } catch (err) {
            res.send({
                type: 'ERROR_GET_ADDRESS',
                message: '获取地址列表失败',
            })
        }
    }

    //通过地址id查询地址
    async getAddressById(req, res, next) {
        const address_id = req.params.address_id;
        if (!address_id || !Number(address_id)) {
            res.send({
                type: 'ERROR_PARAMS',
                message: '参数错误',
            })
            return;
        }

        try {
            const address = await AddressModel.findOne({ id: address_id });
            res.send({ address });
        } catch (err) {
            res.send({
                type: 'ERROR_GET_ADDRESS',
                message: '获取地址信息失败',
            })
        }
    }
}

module.exports = new Address();