const BaseComponent = require('../../prototype/baseComponent');
const OrderModel = require('../../models/bos/order');
const CartModel = require('../../models/v1/cart');
const dtime = require('time-formater');
const Address = require('../../models/v1/address');

class Order extends BaseComponent {
    constructor() {
        super()
        this.postOrder = this.postOrder.bind(this);
    }

    async postOrder(req, res, next) {
        const { user_id, cart_id } = req.params;
        const { address_id, come_from = 'mobile_web', deliver_time = '', description, entities, geohash, paymethod_id = 1 } = req.body;

        try {
            if (!(entities instanceof Array) || !entities.length) {
                throw new Error('entities参数错误');
            } else if (!(entities[0] instanceof Array) || !entities[0].length) {
                throw new Error('entities参数错误');
            } else if (!address_id) {
                throw new Error('address_id参数错误');
            } else if (!user_id || !Number(user_id)) {
                throw new Error('user_id参数错误');
            } else if (!cart_id || !Number(cart_id)) {
                throw new Error('cart_id参数错误');
            }

        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: err.message,
            })
            return;
        }

        let cartDetail, order_id;
        try {
            cartDetail = await CartModel.findOne({ id: cart_id });
            order_id = await this.getId('order_id');
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_GET_DATA',
                message: '获取订单失败'
            })
            return;
        }

        const deliver_fee = { price: cartDetail.cart.deliver_amount };
        const orderObj = {
            basket: {
                group: entities,
                packing_fee: {
                    name: cartDetail.cart.extra[0].name,
                    price: cartDetail.cart.extra[0].price,
                    quantity: cartDetail.cart.extra[0].quantity,
                },
                deliver_fee
            },
            restaurant_id: cartDetail.cart.restaurant_id,
            restaurant_image_url: cartDetail.cart.restaurant_info.image_path,
            formatted_created_at: dtime().format('YYYY-MM-DD HH:mm'),
            order_time: new Date().getTime(),
            time_pass: 900,
            status_bar: {
                color: 'FF6600',
                image_type: '',
                sub_title: '15分钟内支付',
                title: ''

            },
            total_amount: cartDetail.cart.total,
            total_quantity: entities[0].length,
            unique_id: order_id,
            id: order_id,
            user_id,
            address_id
        }

        try {
            await OrderModel.create(orderObj);
            res.send({
                status: 1,
                success: '下单成功，请及时付款',
                need_validation: false,
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_SAVE_ORDER',
                message: '保存订单失败',
            })
        }
    }

    async getOrderCount(req, res, next) {
        const restaurant_id = req.query.restaurant_id;
        try {
            let filter = {};
            if (restaurant_id && Number(restaurant_id)) filter = { restaurant_id };
            const count = await OrderModel.find(filter).count();
            res.send({
                status: 1,
                count,
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_TO_GET_COUNT',
                message: '获取订单数量失败',
            })
        }
    }
}

module.exports = new Order()