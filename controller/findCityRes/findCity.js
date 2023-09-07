const AddressComponent = require('../../prototype/addressComponent.js');

class FindCity extends AddressComponent {
    constructor() {
        super();
        this.getFindCity = this.getFindCity.bind(this);
        this.getLowerCity = this.getLowerCity.bind(this);
    }

    async getFindCity(req, res, next) {
        try {
            let resault = await this.getDistrict();
            res.send({
                status: 1,
                resault: resault.result
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_FIND_CITY_LIST',
                message: '获取省市列表失败'
            })
        }
    }

    async getLowerCity(req, res, next) {
        try {
            const city_id = req.query.city_id;
            const resault = await this.getDistricChildern(city_id);
            res.send({
                status: 1,
                citychilder: resault
            })
        } catch (err) {
            console.log(err);
            res.send({
                status: 0,
                type: 'GET_FIND_CITY_LIST',
                message: '获取下级市失败'
            })
        }
    }
}

module.exports = new FindCity();