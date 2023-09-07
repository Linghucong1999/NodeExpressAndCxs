const mongoose = require('mongoose');
const searchFoodData = require('../../InitData/searchdata');
const dtime = require('time-formater');


const Schema = mongoose.Schema;

const searchSchema = new Schema({
    searchfood_id: Number,
    product_name: String,
    origin_price: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    spec: String,
    small_image: { type: String, default: '' },
    category_id: Number,
    total_sales: { type: Number, default: 0 },
    month_sales: { type: Number, default: 0 },
    stock_number: { type: Number, default: 0 },
    search_number: { type: Number, default: 0 },
    search_time: String,
})
searchSchema.index({ searchfood_id: 1 });
searchSchema.statics.addSearchCount = async function (keyword) {
    try {
        const product = await this.findOne({ product_name: keyword });
        product.search_number++;
        product.search_time = dtime().format('YYYY-MM-DD');
        await product.save();
        return

    } catch (err) {
        console.log(err);
        throw new Error("增加相同种类搜索失败");
    }
}

const SearchData = mongoose.model('Searchdata', searchSchema);

SearchData.findOne().then(data => {
    if (!data) {
        for (let i = 0; i < searchFoodData.length; i++) {
            SearchData.create(searchFoodData[i]);
        }
    }
}).catch(err => {
    console.log(err);
})

module.exports = SearchData;