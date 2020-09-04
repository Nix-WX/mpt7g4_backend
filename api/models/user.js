const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    phone: { type: String, required: true, unique: true, match: /^(01)[0-9](-)*[0-9]{7,8}$/ },
    password: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'], default: 'Female' },
    status: { type: String, required: true, enum: ['Diagnosed', 'High', 'Low', 'Undefined'], default: 'Undefined' }
});

module.exports = mongoose.model('User', userSchema);