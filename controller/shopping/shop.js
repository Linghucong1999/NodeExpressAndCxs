const ShopModel = require('../../models/shopping/shop.js');
const AddressConpont = require('../../prototype/addressComponent.js');
const Food = require('./food.js');
const formidable = require('formidable');
const CategoryHandle = require('./category.js');
const Rating = require('../ugc/rating');


class Shop extends AddressConpont {
    constructor() {
        super()
        this.addShop = this.addShop.bind(this);
        this.getRestaurants = this.getRestaurants.bind(this);
        // this.searchRestaurant = this.searchRestaurant.bind(this);
    }

    //添加商铺
    async addShop(req, res, next) {
        let restaurant_id;
        try {
            restaurant_id = await this.getId('restaurant_id');
        } catch (err) {
            console.log('获取餐厅id失败');
            res.send({
                status: 1,
                type: 'ERROR_DATA',
                message: '获取数据失败'
            })
            return
        }

        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                if (!fields.name) {
                    throw new Error('必须填写商铺名称');
                } else if (!fields.address) {
                    throw new Error('必须填写商店地址');
                } else if (!fields.phone) {
                    throw new Error('必须填写联系电话');
                } else if (!fields.latitude || !fields.longitude) {
                    throw new Error('商品位置信息错误');
                } else if (!fields.image_path) {
                    throw new Error('必须上传图片');
                } else if (!fields.category) {
                    throw new Error('必须上传食品种类');
                }
            } catch (err) {
                console.log('客户端参数出错', err.message);
                res.send({
                    status: 0,
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return
            }
            const exists = await ShopModel.findOne({ name: fields.name });
            if (exists) {
                res.send({
                    status: 0,
                    type: 'RESTURANT_EXISTS',
                    message: '店铺已经存在,请尝试其他店铺名称'
                })
                return
            }
            const opening_hours = fields.startTime && fields.endTime ? fields.startTime + '/' + fields.endTime : '8:30/20:30';
            const newShop = {
                name: fields.name,
                address: fields.address,
                description: fields.description || '',
                float_delivery_fee: fields.float_delivery_fee || 0,
                float_minimum_order_amount: fields.float_minimum_order_amount || 0,
                id: restaurant_id,
                is_premium: fields.is_premium || false,
                is_new: fields.new || false,
                latitude: fields.latitude,
                longitude: fields.longitude,
                location: [fields.longitude, fields.latitude],
                opening_hours: [opening_hours],
                phone: fields.phone,
                promotion_info: fields.promotion_info || '欢迎光临,用餐高峰期请提前下单,谢谢',
                rating: (4 + Math.random()).toFixed(1),
                rating_count: Math.ceil(Math.random() * 1000),
                recent_order_num: Math.ceil(Math.random() * 1000),
                status: Math.round(Math.random()),
                image_path: fields.image_path,
                category: fields.category,
                piecewise_agent_fee: {
                    tips: '配送费￥' + (fields.float_delivery_fee || 0),
                },
                activities: [],
                supports: [],
                license: {
                    business_license_image: fields.business_license_image || '',
                    catering_service_license_image: fields.catering_service_license_image || ''
                },
                identification: {
                    company_name: '',
                    identificate_agency: '',
                    identificate_date: '',
                    legal_person: '',
                    licenses_date: '',
                    licenses_number: '',
                    licenses_scope: '',
                    operation_period: '',
                    registered_address: '',
                    registered_number: ''
                }

            }
            //配送方式
            if (fields.delivery_mode) {
                Object.assign(newShop, {
                    delivery_mode: {
                        color: '57a9ff',
                        id: 1,
                        is_solid: true,
                        text: '顺丰快运'
                    }
                })
            }
            // let activities = JSON.parse(fields.activities);
            // console.log(fields.activities);
            //商店支持的活动
            if (fields.activities) {
                fields.activities.forEach((item, index) => {
                    switch (item.icon_name) {
                        case '减':
                            item.icon_color = 'f07373';
                            item.id = index + 1;
                            break;
                        case '特':
                            item.icon_color = 'edc123';
                            item.id = index + 1;
                            break;
                        case '新':
                            item.icon_color = '70bc46';
                            item.id = index + 1;
                            break;
                        case '领':
                            item.icon_color = 'e3ee0d';
                            item.id = index + 1;
                            break;

                    }
                    newShop.activities.push(item)

                })
            }
            if (fields.bao) {
                newShop.supports.push({
                    description: '已加入"外卖保"计划,食品安全有保障',
                    icon_color: '999999',
                    icon_name: '保',
                    id: 7,
                    name: '外卖保'
                })
            }

            if (fields.onTime) {
                newShop.supports.push({
                    description: '准时到达,超时赔偿',
                    icon_color: '57a9ff',
                    icon_name: '准',
                    id: 9,
                    name: '准时达'
                })
            }

            if (fields.bill) {
                newShop.supports.push({
                    description: '该商家支持开据发票,请在下单前填写好发票抬头',
                    icon_color: '999999',
                    icon_name: '票',
                    id: 4,
                    name: '开发票'
                })
            }

            try {
                //保存数据,并增加对应的食品种类的数量
                const shop = new ShopModel(newShop);
                await shop.save();
                CategoryHandle.addCategory(fields.category);
                Rating.initData(restaurant_id);
                Food.initData(restaurant_id);
                res.send({
                    status: 1,
                    type: '添加餐馆成功',
                    shopDetail: newShop,
                })

            } catch (err) {
                res.send({
                    status: 0,
                    type: 'ERROR_SERVER',
                    message: '添加商铺失败'
                })
            }
        })

    }

    //获取餐馆列表
    async getRestaurants(req, res, next) {
        const {
            latitude,
            longitude,
            offset = 0,
            limit = 20,
            keyword,
            restaurant_category_id,
            order_by,
            extras,
            delivery_mode = [],
            support_ids = [],
            restaurant_category_ids = []
        } = req.query;

        try {
            if (!latitude) {
                throw new Error('latitude参数错误');
            } else if (!longitude) {
                throw new Error('longitude参数错误');
            }
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: err.message,
            })
            return
        }

        let filter = {};
        //获取对应食品种类
        if (restaurant_category_ids.length && Number(restaurant_category_ids[0])) {
            const category = await CategoryHandle.findById(restaurant_category_ids[0]);
            Object.assign(filter, { category });
        }

        //按距离，评分，销量等排序,4是默认排序
        let sortBy = {};
        if (Number(order_by)) {
            switch (Number(order_by)) {
                case 1:
                    Object.assign(sortBy, { float_minimum_order_amount: 1 });
                    break;
                case 2:
                    Object.assign(filter, {
                        location: {
                            $near: [longitude, latitude]
                        }
                    })
                    break;
                case 3:
                    Object.assign(sortBy, { rating: -1 });
                    break;
                case 5:
                    Object.assign(filter, {
                        location: {
                            $near: [longitude, latitude]
                        }
                    })
                    break;
                case 6:
                    Object.assign(sortBy, { recent_order_num: -1 });
                    break;
            }
        }

        //查找配送方式
        if (delivery_mode.length) {
            delivery_mode.forEach(item => {
                if ((Number(item))) {
                    Object.assign(filter, { 'delivery_mode.id': Number(item) });
                }
            })
        }

        //查找活动支持方式
        if (support_ids.length) {
            const filterArr = [];
            support_ids.forEach(item => {
                if (Number(item) && Number(item) !== 8) {
                    filterArr.push(Number(item));
                } else if (Number(item) === 8) {
                    //品牌保证特殊处理
                    Object.assign(filter, { is_premium: true });
                }
            })
            if (filterArr.length) {
                //匹配同时拥有多种活动数据
                Object.assign(filter, { 'supports.id': { $all: filterArr } });
            }
        }

        const restaurants = await ShopModel.find(filter, { _id: 0 }).sort(sortBy).limit(Number(limit)).skip(Number(offset));
        const from = latitude + ',' + longitude;
        let position = [];
        const maxCourrent = 5;  //并发量最大次数限制
        //获取地图API测量距离
        let count = 0;
        let quernArr = [];
        let results;
        for (const [indexList, itemList] of restaurants.entries()) {
            quernArr.push(itemList);
            if (count < maxCourrent && indexList === restaurants.length - 1) {
                results = quernArr.map(async (item, index) => {
                    const to = item.latitude + ',' + item.longitude;
                    const distance = await this.getDistance(from, to);
                    return distance;
                })
                position.push(results);
                quernArr = [];
            } else if (count % maxCourrent === 0) {
                results = quernArr.map(async (item, index) => {
                    const to = item.latitude + ',' + item.longitude;
                    const distance = await this.getDistance(from, to);
                    return distance;
                })
                position.push(results);
                quernArr = [];
                count = 0;
                await new Promise(resolve => setTimeout(resolve, 1000));

            }
            count++;
        }
        let positionArr = await Promise.all(position.flat(Infinity));
        try {
            if (restaurants.length) {
                restaurants.map((item, index) => {
                    return Object.assign(item, positionArr[index]);
                })
            }
        } catch (err) {
            //腾讯地图日用量达到上限,需要优化解决
            console.log("腾讯地图调用出问题" + err);
            restaurants.map((item, index) => {
                return Object.assign(item, { distance: "5公里", order_lead_time: '40分钟' });
            })
        }

        try {
            res.send(restaurants);
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_GET_SHOP_LIST',
                message: '获取店铺列表数据失败'
            })
        }
    }
}

module.exports = new Shop();