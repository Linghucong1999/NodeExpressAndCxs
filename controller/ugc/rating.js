const RatingModel = require("../../models/ugc/rating");

class Rating {
    constructor() {
        this.type = ['ratings', 'scores', 'tags'];
        this.getRatings = this.getRatings.bind(this);
        this.getScores = this.getScores.bind(this);
        this.getTags = this.getTags.bind(this);
    }

    async initData(restaurant_id) {
        try {
            const status = await RatingModel.initData(restaurant_id);
            if (status) {
                console.log("初始化评论数据成功");
            }
        } catch (err) {
            throw new Error(err)

        }
    }

    async getRatings(req, res, next) {
        const restaurant_id = req.params.restaurant_id;
        if (!restaurant_id || !Number(restaurant_id)) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '获取餐馆ID失败'
            })
            return
        }

        try {
            const ratings = await RatingModel.getData(restaurant_id, this.type[0]);
            res.send(ratings);
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_DATA',
                message: '未找到当前餐馆评论数据'
            })
        }
    }

    async getScores(req, res, next) {
        const restaurant_id = req.params.restaurant_id;

        if (!restaurant_id || !Number(restaurant_id)) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '获取餐馆ID失败'
            })
            return
        }

        try {
            const scores = await RatingModel.getData(restaurant_id, this.type[1]);
            res.send(scores);
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_DATA',
                message: '未找到当前餐馆评论数据'
            })
        }
    }

    async getTags(req, res, next) {
        const restaurant_id = req.params.restaurant_id;
        if (!restaurant_id || !Number(restaurant_id)) {
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '获取餐馆ID失败'
            })
            return
        }

        try {
            const tags = await RatingModel.getData(restaurant_id, this.type[2]);
            res.send(tags);
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_DATA',
                message: '未找到当前餐馆评论数据'
            })
        }
    }

}

module.exports = new Rating();