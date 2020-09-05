const mongoose = require('mongoose');

const dailyStatusSchema = mongoose.Schema({
    date: { type: String, default: new Date().toLocaleDateString(), unique: true },
    recovered: { type: Number, default: 0 },
    diagnosed: { type: Number, default: 0 }
});

module.exports = mongoose.model('DailyStatus', dailyStatusSchema);