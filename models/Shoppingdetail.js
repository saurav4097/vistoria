const mongoose = require("mongoose");

const shoppingdetailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    number: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    discription:{
        type:String,
        required:true,
    },
    total:{
        type:Number,
        required:true,
    },
    
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            timestamp: { type: Date, required: true }
        }
    ]
});

const Shoppingdetail = mongoose.model("Shoppingdetail", shoppingdetailSchema, "shoppingdetail");

module.exports = Shoppingdetail;
