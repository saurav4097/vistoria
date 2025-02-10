const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shopname: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    
});

const Shop = mongoose.model('Shop', shopSchema ,'shopdetail');

module.exports = Shop;
