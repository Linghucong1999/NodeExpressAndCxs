const AddressComponent = require("../../prototype/addressComponent.js");
const Cities = require("../../models/v1/cities.js");
const CityHandle = require("./cities.js");


class SearchPlace extends AddressComponent {
    constructor() {
        super();
        this.search = this.search.bind(this);
    }

    async search(req, res, next) {
        let { type = 'search', city_id, keyword } = req.query;
        if (!keyword) {
            res.send({
                name: 'ERROR_QUERY_TYRE',
                message: '参数错误',
            })
            return;
        } else if (isNaN(city_id)) {
            try {

                const cityname = await CityHandle.getCityName(req);
                const cityInfo = await Cities.cityGuess(cityname);
                city_id = cityInfo.id;
            } catch (err) {
                res.send({
                    name: 'ERROR_GET_POSITION',
                    message: '搜索地址时，获取定位失败'
                })
                return;
            }
        }

        try {
            const cityInfo = await Cities.getCityById(Number(city_id));
            const resObj = await this.searchPlace(keyword, cityInfo.name, type);
            const cityList = [];
            if (resObj.status === 0) {
                resObj.data.forEach(item => {
                    cityList.push({
                        name: item.title,
                        address: item.address,
                        latitude: item.location.lat,
                        longitude: item.location.lng,
                        geohash: item.location.lat + ',' + item.location.lng
                    })
                })
                res.send(cityList);
            } else {
                throw new Error(resObj.message)
            }
        } catch (err) {
            res.send({
                name: "GET_ADDRESS_ERROR",
                message: err
            })
        }
    }
}

module.exports = new SearchPlace();