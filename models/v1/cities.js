const mongoose = require('mongoose');
const cityData = require('../../InitData/cities');


const citySchema = new mongoose.Schema({
    data: {}
})

citySchema.statics.cityGuess = function (name) {
    return new Promise(async (resolve, reject) => {
        const fistWord = name.substring(0, 1).toUpperCase();
        try {
            const city = await this.findOne();
            const result = Object.entries(city.data).find(item => item[0] === fistWord);
            if (result) {
                const cityItem = result[1].find(item => item.pinyin === name);
                resolve(cityItem);
            }
        } catch (err) {
            reject({
                name: 'ERROR_DATA',
                message: '查找城市失败'
            })
        }

    })
}

citySchema.statics.cityGroup = function () {
    return new Promise(async (resolve, reject) => {
        try {
            const city = await this.findOne();
            const cityObj = city.data;
            delete (cityObj._id);
            delete (cityObj.hotCities);
            resolve(cityObj);
        } catch (err) {
            reject({
                name: 'ERROR_DATA',
                message: '查找数据失败'
            })
        }
    })
}

citySchema.statics.cityHot = function () {
    return new Promise(async (resolve, reject) => {
        try {
            const city = await this.findOne();
            resolve(city.data.hotCities);
        } catch (err) {
            reject({
                name: 'ERROR_DATA',
                message: '查找热门城市错误'
            })
        }
    })
}

citySchema.statics.getCityById = function (id) {
    return new Promise(async (resolve, reject) => {
        try {
            const city = await this.findOne();
            const result = Object.entries(city.data).find(item => item[0] !== 'hotCities');
            if (result) {
                const cityItem = result[1].find(item => Number(item.id) === id);
                if (cityItem) {
                    resolve(cityItem);
                } else {
                    resolve(null);
                }
            }

        } catch (err) {
            reject({
                name: 'ERROR_DATA',
                message: '查找城市失败',
            })
        }
    })
}

const Cities = mongoose.model('Cities', citySchema);

Cities.findOne().then((err, data) => {
    if (!data) {
        Cities.create({ data: cityData });
    } else {
        console.log(err);
    }
})

module.exports = Cities;