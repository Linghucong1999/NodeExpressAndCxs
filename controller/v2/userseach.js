const AddressComponent = require('../../prototype/addressComponent.js');
const SearchDataModel = require("../../models/v2/userseach.js");
const dtime = require('time-formater');

class UserSearch extends AddressComponent {
    constructor() {
        super();
        this.addSearchFood = this.addSearchFood.bind(this);

    }

    async addSearchFood(req, res, next) {
        const keyword = req.query.search;

        let searchdata = await SearchDataModel.find({
            'product_name': { $regex: new RegExp(`${keyword}`) }
        }, { _id: 0, __v: 0 });

        if (searchdata.length !== 0) {
            const name = searchdata.map(item => {
                return item.product_name;
            })
            let count = 0;    //计数器
            name.forEach(async (item, index) => {
                const similarity = await this.calculateSimilarity(keyword, item);
                if (similarity >= 0.65) {
                    await SearchDataModel.addSearchCount(item);
                    res.send({
                        status: 1,
                        type: 'success',
                        message: "匹配成功"
                    })
                    return
                } else {
                    count++;
                    if (count === name.length) {
                        const search_id = await this.getId('seach_id');
                        const newSearchFood = {
                            searchfood_id: search_id,
                            product_name: keyword,
                            spec: '用户想要的食品,请尽快补充',
                            search_number: 1,
                            search_time: dtime().format('YYYY-MM-DD')
                        }
                        await SearchDataModel.create(newSearchFood);
                        res.send({
                            status: 1,
                            type: 'success',
                            message: "补充成功"
                        })
                        return
                    }
                }
            })
            count = 0;
        } else {
            const search_id = await this.getId('seach_id');
            const newSearchFood = {
                searchfood_id: search_id,
                product_name: keyword,
                spec: '用户想要的食品,请尽快补充',
                search_number: 1,
                search_time: dtime().format('YYYY-MM-DD')
            }
            await SearchDataModel.create(newSearchFood);
            res.send({
                status: 1,
                type: 'success',
                message: "已告诉店主"
            })
        }

    }

    async searchTotal(req, res, next) {
        const { limit = 20, offset = 0 } = req.query
        const allSearchTotal = await SearchDataModel.find({}, { _id: 0, __v: 0 }).sort({ search_number: -1 }).skip(Number(offset)).limit(Number(limit));
        res.send({
            status: 1,
            data: allSearchTotal
        })
    }

    //相似度比较
    async calculateSimilarity(queryValue, existingValue) {
        const queryLength = queryValue.length;
        const existinglength = existingValue.length;
        const maxLength = Math.max(queryLength, existinglength);
        let commonChar = 0;
        for (let i = 0; i < queryLength; i++) {
            if (existingValue.includes(queryValue[i])) {
                commonChar++;
            }
        }

        const similarity = commonChar / maxLength;
        return similarity;
    }
}
module.exports = new UserSearch();