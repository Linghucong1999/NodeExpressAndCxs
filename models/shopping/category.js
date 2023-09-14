const mongoose = require('mongoose');
const categoryData = require('../../InitData/category.js');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    count: Number,
    id: Number,
    ids: [],
    image_url: String,
    level: Number,
    name: String,
    sub_categories: [
        {
            count: Number,
            id: Number,
            image_url: String,
            level: Number,
            name: String
        }
    ]
})

//在定义Schema对象时，可以使用statics属性来定义模型的静态方法（即定义在模型上的方法），这些方法可以直接通过模型调用
categorySchema.statics.addCategory = async function (type) {
    const categoryName = type.split('/');
    try {
        const allcate = await this.findOne();
        const subcate = await this.findOne({ name: categoryName[0] });
        allcate.count++;
        subcate.count++;
        subcate.sub_categories.map(item => {
            if (item.name == categoryName[1]) {
                return item.count++;
            }
        })
        await allcate.save();
        await subcate.save();
        console.log('保存category成功');
        return

    } catch (err) {
        console.log('保存category失败');
        throw new Error(err);
    }
}

const Category = mongoose.model('Category', categorySchema);

Category.findOne().then((data) => {
    if (!data) {
        for (let i = 0; i < categoryData.length; i++) {
            Category.create(categoryData[i]);
        }
    }
}).catch(err => {
    console.log(err);
})

module.exports = Category;