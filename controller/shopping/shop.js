const ShopModel = require('../../models/shopping/shop.js');
const AddressConpont = require('../../prototype/addressComponent.js');
const Food = require('./food.js');
const formidable = require('formidable');
const CategoryHandle = require('./category.js');
const Rating = require('../ugc/rating');
const fs = require("fs");


class Shop extends AddressConpont {
    constructor() {
        super()
        this.addShop = this.addShop.bind(this);
        this.getRestaurants = this.getRestaurants.bind(this);
        this.deleteResturant = this.deleteResturant.bind(this);
        // this.searchRestaurant = this.searchRestaurant.bind(this);
    }

    //添加商铺
    async addShop(req, res, next) {
        let restaurant_id;
        try {
            restaurant_id = await this.getId('restaurant_id');
        } catch (err) {
            res.send({
                status: 1,
                type: 'ERROR_DATA',
                message: '获取餐厅ID失败'
            })
            return
        }
        const form = req.body;

        try {
            if (!form.name) {
                throw new Error('必须填写商铺名称');
            } else if (!form.address) {
                throw new Error('必须填写商店地址');
            } else if (!form.phone) {
                throw new Error('必须填写联系电话');
            } else if (!form.latitude || !form.longitude) {
                throw new Error('商品位置信息错误');
            } else if (!form.image_path) {
                throw new Error('必须上传图片');
            } else if (!form.category) {
                throw new Error('必须上传食品种类');
            }
        } catch (err) {
            console.log('客户端参数出错', err.message);
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: err.message,
            })
            return;
        }

        const exists = await ShopModel.findOne({ name: form.name });
        if (exists) {
            res.send({
                status: 0,
                type: 'RESTURANT_EXISTS',
                message: '店铺已经存在，请尝试其他店铺名称',
            })
            return;
        }

        const opening_hours = form.startTime && form.endTime ? form.startTime + '/' + form.endTime : '8:30/20:30';
        const newShop = {
            name: form.name,
            address: form.address,
            description: form.description || '',
            float_delivery_fee: form.float_delivery_fee || 0,
            float_minimum_order_amount: form.float_minimum_order_amount || 0,
            id: restaurant_id,
            is_premium: form.is_premium || false,
            is_new: form.new || false,
            latitude: form.latitude,
            longitude: form.longitude,
            location: [form.longitude, form.latitude],
            opening_hours: [opening_hours],
            phone: form.phone,
            promotion_info: form.promotion_info || '欢迎光临,用餐高峰期请提前下单,谢谢',
            rating: (4 + Math.random()).toFixed(1),
            rating_count: Math.ceil(Math.random() * 1000),
            recent_order_num: Math.ceil(Math.random() * 1000),
            status: Math.round(Math.random()),
            image_path: form.image_path,
            category: form.category,
            piecewise_agent_fee: { tips: '配送费￥' + (form.float_delivery_fee || 0), },
            activities: [],
            supports: [],
            license: {
                business_license_image: form.business_license_image || '',
                catering_service_license_image: form.catering_service_license_image || ''
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
        if (form.delivery_mode) {
            Object.assign(newShop, {
                delivery_mode: {
                    color: '57a9ff',
                    id: 1,
                    is_solid: true,
                    text: '厨鲜生快达'
                }
            })
        }

        // let activities = JSON.parse(form.activities);
        //商家活动
        if (form.activities) {
            form.activities.forEach((item, index) => {
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

        //商家外卖保险
        if (form.bao) {
            newShop.supports.push({
                description: '已加入"外卖保"计划,食品安全有保障',
                icon_color: '999999',
                icon_name: '保',
                id: 7,
                name: '外卖保'
            })
        }

        //是否承诺出餐准时
        if (form.zhun) {
            newShop.supports.push({
                description: '准时到达,超时赔偿',
                icon_color: '57a9ff',
                icon_name: '准',
                id: 9,
                name: '准时达'
            })
        }

        //商家是否支持开发票
        if (form.piao) {
            newShop.supports.push({
                description: '该商家支持开据发票,请在下单前填写好发票抬头',
                icon_color: '999999',
                icon_name: '票',
                id: 4,
                name: '开发票',
            })
        }

        try {
            //保存数据，并增加对应的食品种类的数量
            const shop = new ShopModel(newShop);
            await shop.save();
            CategoryHandle.addCategory(form.category);
            Rating.initData(restaurant_id);
            Food.initData(restaurant_id);
            res.send({
                status: 1,
                message: '添加场馆成功',
                shopDetail: newShop,
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_SERVER',
                message: '添加商铺失败',
            })
        }



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
                results = await Promise.all(quernArr.map(async (item, index) => {
                    const to = item.latitude + ',' + item.longitude;
                    const distance = await this.getDistance(from, to);
                    return distance;
                }))
                position.push(...results);
                quernArr = [];
            } else if (count % maxCourrent === 0) {
                results = await Promise.all(quernArr.map(async (item, index) => {
                    const to = item.latitude + ',' + item.longitude;
                    const distance = await this.getDistance(from, to);
                    return distance;
                }))
                position.push(...results);
                quernArr = [];
                count = 0;
                await new Promise(resolve => setTimeout(resolve, 1000));

            }
            count++;
        }
        // let positionArr = await Promise.all(position.flat(Infinity));
        // console.log(position);
        try {
            if (restaurants.length) {
                restaurants.map((item, index) => {
                    return Object.assign(item, position[index]);
                })
            }
        } catch (err) {
            //腾讯地图日用量达到上限,需要优化解决
            console.log("腾讯地图调用出问题,请及时处理" + err);
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

    //获取餐馆ID详情
    async getRestaurantDetail(req, res, next) {
        const restaurant_id = req.params.restaurant_id;
        if (!restaurant_id || !Number(restaurant_id)) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '餐馆ID参数错误',
            })
            return;
        }

        try {
            const restaurant = await ShopModel.findOne({ id: restaurant_id }, { _id: 0 });
            res.send(restaurant);
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_DATA_ERROR',
                message: '获取餐馆详情失败',
            })
        }
    }

    //获取餐馆数量
    async getShopCount(req, res, next) {
        try {
            const count = await ShopModel.count();
            res.send({
                status: 1,
                count,
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_TO_GET_COUNT',
                message: '获取餐馆数量失败',
            })
        }
    }

    //删除餐馆
    async deleteResturant(req, res, next) {
        const restaurant_id = req.params.restaurant_id;
        if (!restaurant_id || !Number(restaurant_id)) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: 'restaurant_id参数错误',
            })
            return;
        }

        try {
            const booleImg = await this.deleteShopImage(restaurant_id);
            const resShop = await ShopModel.deleteOne({ id: restaurant_id });
            res.send({
                status: 1,
                message: '删除成功',
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'DELETE_RESTURANT_FAILED',
                message: '删除餐馆失败',
            })
        }

    }

    //删除场馆营业照等
    async deleteShopImage(id) {
        let result = await ShopModel.findOne({ id }, { _id: 0 });
        const image_path = "./public/img/" + result.image_path;
        const license_img_path = "./public/img/" + result.license.business_license_image;
        const servise_img_path = "./public/img/" + result.license.catering_service_license_image;
        const pathTotale = [image_path, license_img_path, servise_img_path];
        const deletePromise = pathTotale.map(path => {
            return new Promise((resolve, reject) => {
                fs.unlink(path, (err) => {
                    if (err) {
                        resolve("看情况");
                    } else {
                        resolve(true);
                    }
                })
            })
        })
        const promiseImgRes = await Promise.all(deletePromise);
        return promiseImgRes;
    }

    //更新店铺
    async updatashop(req, res, next) {
        let form = req.body;
        if (JSON.stringify(form) === '{}') {
            res.send({
                status: 0,
                type: 'ERROR_FORM',
                message: '未修改表单'
            })
            return;
        }

        const { name, address, description = "", phone, category, id, latitude, longitude, image_path } = form;
        try {
            if (!name) {
                throw new Error('餐馆名称错误');
            } else if (!address) {
                throw new Error('餐馆地址错误');
            } else if (!phone) {
                throw new Error('餐馆电话错误');
            } else if (!category) {
                throw new Error('餐馆分类错误');
            } else if (!id || !Number(id)) {
                throw new Error('餐馆ID错误');
            } else if (!image_path) {
                throw new Error('餐馆图片地址错误');
            }

            let newData;
            if (latitude && longitude) {
                newData = { name, address, description, phone, category, id, latitude, longitude, image_path }
            } else {
                newData = { name, address, description, phone, category, id, image_path };
            }
            await ShopModel.findOneAndUpdate({ id }, { $set: newData });
            // console.log(newData);
            res.send({
                status: 1,
                success: '修改商铺信息成功',
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_UPDATE_RESTAURANT',
                message: '更新商铺信息失败',
            })
        }
    }

    //搜索店铺
    async searchShop(req, res, next) {
        const word = req.query.word;
        try {
            let resultShop = await ShopModel.find({ name: new RegExp(word) });
            let shopname = [];
            resultShop.forEach(item => {
                let table = {
                    name: item.name
                }
                shopname.push(table);
            })
            res.send({
                status: 1,
                shopname,
            });
        } catch (err) {
            res.send({
                status: 0,
                message: '无此店铺'
            })
        }
    }

    //通过餐馆名称获取餐馆详情
    async getRestaurantNameDetail(req, res, next) {
        const shopName = req.query.name;
        if (!shopName) {
            res.send({
                status: 0,
                type: 'GET_ERROR_NAME',
                message: '未携带店铺名称',
            })
            return;
        }
        try {
            let restaurantNmae = await ShopModel.findOne({ name: shopName }, { _id: 0 });
            res.send({
                status: 1,
                restaurantNmae,
            })
        } catch (err) {
            res.send({
                status:0,
                message:'发生未知错误',
            })
        }
    }
}

module.exports = new Shop();