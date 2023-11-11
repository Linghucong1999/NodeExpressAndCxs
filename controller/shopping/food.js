const { Food: FoodModel, Menu: MenuModel } = require("../../models/shopping/food");
const ShopModel = require("../../models/shopping/shop");
const BaseComponent = require("../../prototype/baseComponent");
const formidable = require("formidable");

class Food extends BaseComponent {
    constructor() {
        super();
        this.defaultData = [
            {
                name: '热销榜',
                description: '榜上有名',
                icon_url: '',
                is_selected: true,
                type: 1,
                foods: []
            }, {
                name: '优惠',
                description: '美味又实惠',
                icon_url: '',
                is_selected: true,
                type: 1,
                foods: []
            }
        ];
        this.initData = this.initData.bind(this);
        this.addCategory = this.addCategory.bind(this);
        this.addFood = this.addFood.bind(this);
        this.getSpecfood = this.getSpecfood.bind(this);
    }

    //每个餐馆都有一个初始化评论数据
    async initData(restaurant_id) {
        for (let i = 0; i < this.defaultData.length; i++) {
            let category_id;
            try {
                category_id = await this.getId('category_id');
            } catch (err) {
                throw new Error(err);
            }

            const defaultData = this.defaultData[i];
            const Category = { ...defaultData, id: category_id, restaurant_id };
            const newFood = new MenuModel(Category);
            try {
                await newFood.save();
                console.log('初始化食品数据成功');
            } catch (err) {
                console.log('初始化食品数据失败');
                throw new Error(err);
            }
        }
    }

    //获取特定餐馆种类
    async getCategory(req, res, next) {
        const restaurant_id = req.params.restaurant_id;
        try {
            const category_list = await MenuModel.find({ restaurant_id }, { _id: 0, __v: 0 }).lean();
            res.send({
                status: 1,
                category_list,
            })
        } catch (err) {
            console.log(err);
            res.send({
                status: 0,
                type: 'ERROR_GET_DATA',
                message: '获取数据失败',
            })
        }
    }


    //添加食品种类
    async addCategory(req, res, next) {

        const { name, description, restaurant_id } = req.body;

        try {
            if (!name) {
                throw new Error('必须填写食品类型名称');
            } else if (!restaurant_id) {
                throw new Error('餐馆ID参数错误');
            }
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: err.message
            })
            return;
        }

        let category_id;
        try {
            category_id = await this.getId('category_id');
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_ERROR',
                message: '获取食品种类ID失败'
            })
            return;
        }

        const foodObj = {
            name: name,
            description: description,
            restaurant_id: restaurant_id,
            id: category_id,
            foods: [],
        }

        const newFood = new MenuModel(foodObj);
        try {
            await newFood.save();
            const category = await MenuModel.find({ restaurant_id }, { _id: 0, __v: 0 });

            res.send({
                status: 1,
                category: category,
                success: '添加食品种类成功',
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_IN_SAVE_DATA',
            })
        }

    }

    //添加食品
    async addFood(req, res, next) {
        const form = req.body;
        try {
            if (!form.name) {
                throw new Error('必须填写食品名称');
            } else if (!form.image_path) {
                throw new Error('必须上传食品图片');
            } else if (!form.specs.length) {
                throw new Error('必须填写一种规格');
            } else if (!form.category_id) {
                throw new Error('食品类型ID错误');
            } else if (!form.restaurant_id) {
                throw new Error('餐厅ID错误');
            }
        } catch (err) {
            res.send({
                status: 0,
                success: err,
            })
            return;
        }
        let category, restaurant;
        try {
            category = await MenuModel.findOne({ id: form.category_id });
            restaurant = await ShopModel.findOne({ id: form.restaurant_id });
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_DATA',
                success: err.message,
            })
            return;
        }
        let item_id;
        try {
            item_id = await this.getId('item_id');
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_DATA',
                message: err.message,
            })
            return;
        }

        const rating_count = Math.ceil(Math.random() * 1000);
        const month_sales = Math.ceil(Math.random() * 1000);
        const tips = rating_count + '评价 月售' + month_sales + "份";
        const newFood = {
            name: form.name,
            description: form.description,
            image_path: form.image_path,
            activity: null,
            attributes: form.attributes,
            restaurant_id: form.restaurant_id,
            category_id: form.category_id,
            satisfy_rate: Math.ceil(Math.random() * 100),
            satisfy_count: Math.ceil(Math.random() * 1000),
            item_id,
            rating_count,
            month_sales,
            rating: (4 + Math.random()).toFixed(1),
            tips,
            specfoods: [],
            specifications: [],
        }

        if (form.activity) {
            newFood.activity = {
                image_text_color: 'f1884f',
                icon_color: 'f07373',
                image_text: form.activity
            }
        }


        if (form.attributes.length > 0) {
            form.attributes.forEach(item => {
                let attr;
                switch (item) {
                    case '新':
                        attr = {
                            icon_color: '5ec452',
                            icon_name: '新',
                        }
                        break;
                    case '招牌':
                        attr = {
                            icon_color: 'f07373',
                            icon_name: '招牌',
                        }
                        break;
                }

                newFood.attributes.push(attr);
            });
        }

        try {
            const [specfood, specifications] = await this.getSpecfood(form, item_id);
            newFood.specfoods = specfood;
            newFood.specifications = specifications;

        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_DATA',
                message: err
            })
            return;
        }

        try {
            const foodEntity = await FoodModel.create(newFood);
            category.foods.push(foodEntity);
            category.markModified('foods');
            await category.save();
            res.send({
                status: 1,
                message: '添加食品成功',
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_DATA',
                message: err
            })
        }

    }

    //食品规格的添加
    async getSpecfood(form, item_id) {
        let specfoods = [], specifications = [];
        if (form.specs.length < 2) {
            let food_id, sku_id;
            try {
                sku_id = await this.getId("sku_id");
                food_id = await this.getId("food_id");

            } catch (err) {
                throw new Error('获取sku_id、food_id失败');
            }

            specfoods.push({
                packing_fee: form.specs[0].packing_fee,
                price: form.specs[0].price,
                specs: [],
                specs_name: form.specs[0].specs,
                name: form.name,
                item_id,
                sku_id,
                food_id,
                restaurant_id: form.restaurant_id,
                category_id: form.category_id,
                recent_popularity: Math.ceil(Math.random() * 1000),
                recent_rating: (Math.random() * 5).toFixed(1),
            })
        } else {
            specifications.push({
                values: [],
                name: '规格',
            });

            for (let i = 0; i < form.specs.length; i++) {
                let food_id, sku_id;
                try {
                    sku_id = await this.getId("sku_id");
                    food_id = await this.getId("food_id");

                } catch (err) {
                    throw new Error('获取sku_id、food_id失败');
                }
                specfoods.push({
                    packing_fee: form.specs[i].packing_fee,
                    price: form.specs[i].price,
                    specs: [],
                    specs_name: form.specs[i].specs,
                    name: form.name,
                    item_id,
                    sku_id,
                    food_id,
                    restaurant_id: form.restaurant_id,
                    category_id: form.category_id,
                    recent_popularity: Math.ceil(Math.random() * 1000),
                    recent_rating: (Math.random() * 5).toFixed(1),
                });

                specifications[0].values.push(form.specs[i].specs);
            }
        }

        return [specifications, specfoods];
    }

    //搜索食品
    async searchFood(req, res, next) {
        const word = req.query.word;
        try {
            let resultFood = await FoodModel.find({ name: new RegExp(word) });
            let foodname = [];
            resultFood.forEach(item => {
                let table = {
                    name: item.name,
                }
                foodname.push(table)
            })
            res.send({
                status: 1,
                foodname,
            })
        } catch (err) {
            res.send({
                status: 0,
                message: '搜索失败',
            })
        }
    }

    //查找特定食品
    async getFoods(req, res, next) {
        const { restaurant_id, limit = 20, offset = 0 } = req.query;
        try {
            let filter = {};
            if (restaurant_id && Number(restaurant_id)) {
                filter.restaurant_id = restaurant_id;
            }

            const foods = await FoodModel.find(filter, { _id: 0 }).sort({ item_id: -1 }).limit(Number(limit)).skip(Number(offset));
            res.send(foods);
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_DATA_ERROR',
                message: '获取食品数据失败',
            })
        }
    }


    //获取店铺食品数量
    async getFoodsCount(req, res, next) {
        const { restaurant_id } = req.query;
        try {
            let filter = {}
            if (restaurant_id && Number(restaurant_id)) {
                filter.restaurant_id = restaurant_id;
            }

            const count = await FoodModel.find(filter).count();
            res.send({
                status: 1,
                count,
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_DATA_ERROR',
                message: '获取食品数量失败',
            })
        }
    }

    //获取种类表单
    async getMenuDetail(req, res, next) {
        const category_id = req.params.category_id;
        if (!category_id || !Number(category_id)) {
            res.send({
                status: 0,
                type: 'PARAM_ERROR',
                message: 'Menu ID参数错误',
            });
            return;
        }

        try {
            const menu = await MenuModel.findOne({ id:category_id }, { _id: 0 });
            res.send({
                status: 1,
                data: menu,
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_DATA_ERROR',
                message: '获取Menu详情失败',
            })
        }
    }

    //获取菜单列表
    async getMenu(req, res, next) {
        const restaurant_id = req.query.restaurant_id;
        const allMenu = req.query.allMenu;
        if (!restaurant_id && !Number(restaurant_id)) {
            res.send({
                status: 0,
                type: 'PARAM_ERROR',
                message: 'restaurant_id参数错误'
            })
            return;
        }

        let filter = {};
        if (allMenu) {
            filter = { restaurant_id: restaurant_id };
        } else {
            filter = { restaurant_id, $where: function () { return this.foods.length } };
        }

        try {
            const menu = await MenuModel.find(filter, { _id: 0 });
            res.send({
                status: 1,
                menu,
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_DATA_ERROR',
                message: '获取Menu列表失败',
            })
        }
    }

    //删除食品
    async deleteFood(req, res, next) {
        const food_id = req.params.food_id;
        if (!food_id && !Number(food_id)) {
            res.send({
                status: 0,
                type: 'PARAM_ERROR',
                message: 'food_id参数错误'
            })
            return;
        }

        try {
            const food = await FoodModel.findOne({ item_id: food_id });
            const menu = await MenuModel.findOne({ id: food.category_id });
            let subFood = menu.foods.id(food._id);
            await subFood.remove();
            await menu.save();
            await food.remove();
            res.send({
                status: 1,
                message: '删除食品成功'
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'DELETE_DATA_ERROR',
                message: '删除食品失败'
            })
        }
    }
}

module.exports = new Food();