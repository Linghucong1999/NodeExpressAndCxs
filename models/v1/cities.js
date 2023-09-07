const mongoose = require('mongoose');
const cityData = require('../../InitData/cities');


const citySchema = new mongoose.Schema({
    data: {}
})

citySchema.statics.cityGuess = function (name) {
    return new Promise(async (resolve, reject) => {
        const fistWord = name.substring(0, 1).toUpperCase();
        console.log(fistWord);
        try {
            const city = await this.findOne();
            Object.entries(city.data).forEach(item => {
                // if (item[0] == fistWord) {
                //     item[1].forEach(cityItem => {

                //     })
                // }
            })
        } catch (err) {
            reject({
                name: 'ERROR_DATA',
                message: '查找数据失败',
            });
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

const Cities = mongoose.model('Cities', citySchema);

Cities.findOne((err, data) => {
    if (!data) {
        Cities.create({ data: cityData });
    }
})

module.exports = Cities;