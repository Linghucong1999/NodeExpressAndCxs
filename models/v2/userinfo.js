const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userInfoSchema = new Schema({
    avatar: { type: String, default: 'default.jpg' },
    babance: { type: Number, default: 0 },
    brand_member_new: { type: Number, default: 0 },
    current_address_id: { type: Number, default: 0 },
    current_invoice_id: { type: Number, default: 0 },
    delivery_card_expire_days: { type: Number, default: 0 },
    email: { type: String, default: '' },
    gift_amount: { type: Number, default: 3 },
    city: String,
    registe_time: String,
    id: Number,
    user_id: Number,
    is_active: { type: Number, default: 1 },
    is_email_vaild: { type: Boolean, default: false },
    is_mobile_vaild: { type: Boolean, default: true },
    mobile: { type: String, default: '' },
    point: { type: Number, default: 0 },
    username: String,
    column_desc: {
        game_desc: { type: String, default: '玩游戏领红包' },
        game_image_hash: { type: String, defult: '' },
        game_is_show: { type: Number, default: 1 },
        game_link: { type: String, default: '' },
        game_mall_desc: { type: String, default: '0元好物' }
    },
})

userInfoSchema.index({ id: 1 });

const UserInfo = mongoose.model('UserInfo', userInfoSchema);

module.exports = UserInfo;