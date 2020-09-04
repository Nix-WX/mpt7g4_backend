const mongoose = require('mongoose');

const historySchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    checkIn: { type: Date },
    checkOut: { type: Date, default: null }
}, { timestamps: { createdAt: 'checkIn' } });

module.exports = mongoose.model('History', historySchema);