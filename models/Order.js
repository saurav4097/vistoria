const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
     productId: { 
            type: mongoose.Schema.Types.ObjectId, ref: 'Product',
             required: true },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    offer: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    
    useremail: {
        type: String,
        required: true,
       
    },
    quantity:{
        type:Number,
        required:true,
        default:1,
    },
    imageUrl: {  
        type: String, // Store the URL/path of the image
        required: true // Make it required if all products must have an image
    },
    status:{
        type:String,
        required:true,
        default:'order confirmed'
    },
    timestamp: { type: Date, required: true }
    
});

const Order = mongoose.model('Order', orderSchema ,'order');

module.exports = Order;
