
const mongoose = require('mongoose');
const activityData = require('../../InitData/activity.js');

const Schema = mongoose.Schema;
const activitySchema = new Schema({
    description: String,
    icon_color: String,
    icon_name: String,
    id: Number,
    name: String,
    rangking_weight: Number
})

activitySchema.index({ index: 1 });

const Activity = mongoose.model('Activity', activitySchema);

Activity.findOne().then(data => {
    if (!data) {
        activityData.forEach(item => {
            Activity.create(item);
        })
    }
}).catch(err => {
    console.log(err);
})

module.exports = Activity;