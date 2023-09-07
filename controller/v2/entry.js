const EntryModel = require('../../models/v2/entry.js');

class Entry {
    constructor() {

    }

    async getEntry(req, res, next) {
        try {
            const entries = await EntryModel.find({}, { _id: 0 });
            res.send(entries);

        } catch(err) {
            res.send({
                status:0,
                type:'ERROR_DATA',
                message:'获取数据失败'
            })
        }
    }
}

module.exports = new Entry();