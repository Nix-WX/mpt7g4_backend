const mongoose = require('mongoose');

const shopSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    location: [
        { type: Number, required: true},
        { type: Number, required: true}
    ]
});

module.exports = mongoose.model('Shop', shopSchema);