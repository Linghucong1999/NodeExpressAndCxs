const Cities = require('../../models/v1/cities');
const pinyin = require('pinyin');
const AddressComponent = require('../../prototype/addressComponent');

class CityHandle extends AddressComponent {
    constructor() {
        super();
        this.getCity = this.getCity.bind(this);
    }

    async getCity(req, res, next) {
        const type = req.query.type;
        let cityInfo;
        try {
            switch (type) {
                case 'guess':
                    const city = await this.getCityName(req);
                    cityInfo = await Cities.getGuess(city);
            }
        } catch (err) {

        }
    }

    async getCityName(req) {
        try {
            const cityInfo = await this.guessPostion(req);
        } catch (err) {

        }
    }

}