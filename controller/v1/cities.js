const Cities = require('../../models/v1/cities');
// import pinyin from "pinyin";
const pinyin = require('pinyin');
const AddressComponent = require('../../prototype/addressComponent');

class CityHandle extends AddressComponent {
    constructor() {
        super();
        this.getCity = this.getCity.bind(this);
        this.getExactAddress = this.getExactAddress.bind(this);
    }

    async getCity(req, res, next) {
        const type = req.query.type;
        let cityInfo;
        try {
            switch (type) {
                case 'guess':
                    const city = await this.getCityName(req);
                    cityInfo = await Cities.cityGuess(city);
                    break;
                case 'hot':
                    cityInfo = await Cities.cityHot();
                    break;
                case 'group':
                    cityInfo = await Cities.cityGroup();
                    break;
                default:
                    res.json({
                        name: 'ERROR_QUERY_TYRE',
                        message: '参数错误',
                    })
                    return
            }
            res.send(cityInfo);
        } catch (err) {
            res.send({
                name: 'ERROR_DATA',
                message: '获取数据失败',
            })
        }
    }

    async getCityName(req) {
        try {
            const cityInfo = await this.guessPostion(req);
            /**
             *  汉字转换成拼音
             */
            if (cityInfo === '') {
                return 'beijing';
            }
            const pinyinArr = pinyin.pinyin(cityInfo.city, { mode: pinyin.STYLE_NORMAL })
            let cleanedPinyin=pinyinArr.map(subArray => subArray.map(p => p.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
            let cityName = '';
            cleanedPinyin.forEach(item => {
                cityName += item[0];
            })
            return cityName;
        } catch (err) {
            return '广州';
        }
    }

    async getCityById(req, res, next) {
        const cityid = Number(req.params.id);
        if (isNaN(cityid)) {
            res.json({
                name: 'ERROR_QUERY_TYRE',
                message: '参数错误',
            })
            return
        }

        try {
            const cityInfo = await Cities.getCityById(cityid);
            res.send(cityInfo);
        } catch (err) {
            res.send({
                name: 'ERROR_DATA',
                message: '获取数据失败',
            })
        }
    }

    async getExactAddress(req, res, next) {
        try {
            const position = await this.geocoder(req);
            if (position.status === 0) {
                res.send(position.result);
            } else {
                throw new Error(position.message);
            }
        } catch (err) {
            res.send({
                name: "ERROR_DATA",
                message: err,
            })
        }
    }

    async pois(req, res, next) {
        try {
            const geohash = req.params.geohash || '';
            if (geohash.indexOf(',') === -1) {

            }
        } catch (err) {

        }
    }

}

module.exports = new CityHandle();