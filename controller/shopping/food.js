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
    }

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

}

module.exports = new Food();