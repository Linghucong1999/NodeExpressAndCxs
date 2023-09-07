const shopping = require('./shopping.js');
const admin = require('./admin.js');
const statis = require('./statis.js');
const v2 = require('./v2.js');
const v1 = require('./v1.js');
const eus = require('./eus.js');
const findcity = require('./findcity');


module.exports = app => {
    app.use('/shopping', shopping);
    app.use('/admin', admin);
    app.use('/statis', statis);
    app.use('/v2', v2);
    app.use('/v1', v1);
    app.use('/eus', eus);
    app.use('/findcity', findcity);
}