const mongoose = require('mongoose');
const deliveryData = require('../../InitData/delivery.js');

const Schema = mongoose.Schema;

const DeliverySchema = new Schema({
    color: String,
    id: Number,
    is_solid: Boolean,
    text: String
})

DeliverySchema.index({ id: 1 });

const Deilvery = mongoose.model('Delivery', DeliverySchema);


Deilvery.findOne().then(data => {
    if (!data) {
        Deilvery.create(deliveryData);
    }
}).catch(err => {
    console.log(err);
})

module.exports = Deilvery;