const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
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
    }
    
});

const Cart = mongoose.model('Cart', cartSchema ,'cart');

module.exports = Cart;
