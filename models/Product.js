const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
    detail: {
        type: String,
        required: true,
    },
    
    email: {
        type: String,
        required: true,
       
    },
    images: {
        type: [String], // Array to store images as Base64 strings
        validate: {
          validator: function (value) {
            return value.length > 0; // Ensure that there is at least one image
          },
          message: 'At least one image is required.'
        }
      }
});

const Product = mongoose.model('Product', productSchema ,'product');

module.exports = Product;
