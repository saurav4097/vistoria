const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');  // To hash passwords
const app = express();
const moment = require('moment-timezone');  // Import moment-timezone

const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const Cart=require('./models/Cart');
const Shoppingdetail = require('./models/shoppingdetail');
const Order = require('./models/Order');
const storage = multer.memoryStorage(); // Store files in memory (not the filesystem)
const upload = multer({ storage: storage });
// Middleware to parse form data and JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Set up view engine (ejs)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (e.g., CSS, JS, images) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

// MongoDB setup using Mongoose
const dbURI = 'mongodb://localhost:27017/vistoria'; // Database URI
mongoose.connect(dbURI)
    .then(() => {
        console.log('Connected successfully to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

    // Setup session middleware (assuming you're using it to track login status)

// Root route to render 'index.ejs'
app.get('/', async (req, res) => {
    
    try{const data = {
        title: "Home Page",
        message: "Welcome to my website!"
    };
    const shops = await Shop.find();
    const products = await Product.find();
    res.render('index', {data,shops,products});
  } catch(err){
    console.error('Error retrieving products:', err);
        res.status(500).send('Error retrieving products');
  } 
});
app.get('/productlist', async (req, res) => {
    try {
        const products = await Product.find();
        console.log('Products fetched:', products);
        res.render('productlist', { products });
    } catch (err) {
        console.error('Error retrieving products:', err);
        res.status(500).send('Error retrieving products');
    }
});
app.get('/shoplist', async (req, res) => {
    try {
        const shops = await Shop.find();
        console.log('shops fetched:', shops);
        res.render('shoplist', { shops });
    } catch (err) {
        console.error('Error retrieving shops:', err);
        res.status(500).send('Error retrieving shops');
    }
});
// Product details route
app.get('/product/:_id', async (req, res) => {
    try {
        const productId = req.params._id;
        const product = await Product.findById(productId);
        const shop = await Shop.findOne({ email: { $regex: `^${product.email}$`, $options: 'i' } });

        if (product) {
            res.render('product', { product,shop });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).send('Internal server error');
    }
});


app.get('/shop/:_id', async (req, res) => {
    try {
        const shopId = req.params._id;
        const shop = await Shop.findById(shopId);
        const products = await Product.find({ email: { $regex: `^${shop.email}$`, $options: 'i' } });

        if (shop) {
            res.render('shop', { shop,products });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).send('Internal server error');
    }
});

// Search route
app.get('/search', async (req, res) => {
    const query = req.query.query;
    try {
        const products = await Product.find({
            name: { $regex: query, $options: 'i' }
        });
        res.render('search', { products });
    } catch (err) {
        console.error('Error retrieving products:', err);
        res.status(500).send('Error retrieving products');
    }
});
app.get('/searchshop', async (req, res) => {
    const query = req.query.query;
    try {
        const shops = await Shop.find({
            shopname: { $regex: query, $options: 'i' }
        });
        res.render('searchshop', { shops });
    } catch (err) {
        console.error('Error retrieving products:', err);
        res.status(500).send('Error retrieving products');
    }
});

let parmanentemail=null;
let parmanentshop=null;
// Signup route /////////////////////////////////////////////
///////////////////////////////////////////////////////////

app.get('/signup', (req, res) => {
    res.render('signup', { errorMessage: null });
});

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    console.log(req.body);  // Log the incoming data for debugging

    try {
        // Ensure no trailing spaces in email
        const trimmedEmail = email.trim();

        // Check if user already exists with the same email (case-insensitive)
        const user = await User.findOne({ email: { $regex: `^${trimmedEmail}$`, $options: 'i' } });

        if (user) {
            return res.render('signup', { errorMessage: 'This user already exists, please go to the login page.' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with only name, email, and hashed password
        const newUser = new User({
            name: username,
            email: trimmedEmail,
            password: hashedPassword,  // Save hashed password
        });

        // Save the new user to the database
        await newUser.save();
        console.log('User registered successfully');
        parmanentemail=newUser.email;
        res.redirect('/');  // Redirect to home page after successful registration

    } catch (err) {
        // Log and display the error for easier debugging
        console.error('Error inserting document:', err);
        res.status(500).send(`Error inserting document: ${err.message}`);
    }
});


// Route for login page/////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

app.get('/signin', (req, res) => {
    res.render('signin', { errorMessage: null });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    parmanentemail = email;
    try {
        console.log('Email entered:', email);
        const trimmedEmail = email.trim();
        const user = await User.findOne({ email: { $regex: `^${trimmedEmail}$`, $options: 'i' } });

        if (!user) {
            return res.render('signin', { errorMessage: 'This user does not exist, please sign up first.' });
        }

        if (user.password !== password) {
            return res.render('signin', { errorMessage: 'Password is wrong, please try again.' });
        }

        console.log('User authenticated successfully');
        
        res.redirect('/profile');
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Internal server error');
    }
});
// change password  page/////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

app.get('/passchange', (req, res) => {
    res.render('passchange', { errorMessage: null });
});

app.post('/passchange', async (req, res) => {
    const { username , email, password } = req.body;
    parmanentemail = email;
    try {
        console.log('Email entered:', email);
        const trimmedEmail = email.trim();
        const user = await User.findOne({ email: { $regex: `^${trimmedEmail}$`, $options: 'i' } });

        if (!user) {
            return res.render('passchange', { errorMessage: 'This user does not exist, please sign up first.' });
        }

        if (user.name != username) {
            return res.render('passchange', { errorMessage: 'User Name is wrong, please try again.' });
        }

        console.log('User authenticated successfully');
        await User.findByIdAndUpdate(user._id, { username, email,password});
        res.redirect('/');
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Internal server error');
    }
});
/////profile///////////////////////////////////////////////////////////////////////////////////


app.get('/profile', async(req, res) => {
    if (parmanentemail==null) {
        // If no user session exists, redirect to the signup page
        return res.redirect('/signin');
    }
    const user = await User.findOne({ email: { $regex: `^${parmanentemail}$`, $options: 'i' } });

    const profile =  user;
    res.render('profile', { profile });
});
//////addshop ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/addshop', (req, res) => {
    res.render('addshop', { errorMessage: null });
});

app.post('/addshop', async (req, res) => {
    const { shopname, location } = req.body;
    const user = await User.findOne({ email: { $regex: `^${parmanentemail}$`, $options: 'i' } });

    console.log(req.body);  // Log the incoming data for debugging
    const newShop = new Shop({
        shopname:shopname,
        location:location,
        name:user.name ,
        email: parmanentemail,
       
    });

    // Save the new user to the database
    await newShop.save();
    parmanentshop=parmanentemail;
    res.render('/index');
});
// Edit shop //////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
app.get('/editshop', async (req, res) => {
    const { shopId } = req.query;
    try {
        const shop = await Shop.findById(shopId); // Fetch the product by ID
        res.render('editshop', { shop: shop });
    } catch (err) {
        res.status(500).send("Error fetching shop details.");
    }
});

// Update shop (POST)
app.post('/updateshop', async (req, res) => {
    const { shopId, shopname, location,name,email } = req.body;
    try {
        await Shop.findByIdAndUpdate(shopId, { shopname, location, name, email });
        res.redirect('/shopkeeper'); // Redirect back to the shopkeeper page
    } catch (err) {
        res.status(500).send("Error updating product.");
    }
});


////shop/////////////////////////////////////////////////////////////////////////////////
app.get('/shopkeeper', async(req, res) => {
    if (parmanentemail==null) {
        // If no user session exists, redirect to the signup page
        return res.redirect('/signin');
    }
    const shop = await Shop.findOne({ email: { $regex: `^${parmanentemail}$`, $options: 'i' } });
    

    if(shop==null){
        return res.redirect('/addshop');
     }
     parmanentshop=parmanentemail;
        
        const products= await Product.find({ email: { $regex: `^${parmanentemail}$`, $options: 'i' } });
        const profile = shop;
        res.render('shopkeeper', { profile:profile, data: products });
});
///////addproduct//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
app.get('/addproduct', (req, res) => {
    res.render('addproduct');
});
app.post('/addproduct', upload.array('productImages', 3),  async (req, res) => {
    // Destructure from req.body, not req.params
    const { name, price, offer, detail } = req.body;
    const email = parmanentemail;  // Assuming email is being stored globally
     // Process uploaded images (up to 3 images)
     const productImages = req.files ? req.files.map(file => file.buffer.toString('base64')) : [];


    console.log("Received product data:");
    console.log({ name, price, offer, detail, email });

    // Check if all fields are provided
    if (!name || !price || !offer || !detail || !email) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Create a new product document
        const newProduct = new Product({
            name: name,
            price: price,
            offer: offer,
            detail: detail,
            email: email,
            images: productImages
        });

        // Save the new product to the database
        await newProduct.save();
        console.log('Product added successfully');

        // Redirect to the shopkeeper page after successful product creation
        res.redirect('/shopkeeper');
    } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).json({ message: error.message });
    }
});
//////DELET////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/delete", async (req, res) => {
    const topicToDelete = req.body.topic;
    try {
         await Product.deleteOne({ name: topicToDelete });

        // Check if something was deleted
        
            const data = await Product.find({});
            res.redirect('/shopkeeper');
        
    } catch (err) {
        console.error('Error deleting data:', err);
        res.status(500).send('Error deleting data');
    }
});
//////editbutton////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Edit Product (GET)
app.get('/editproduct', async (req, res) => {
    const { productId } = req.query;
    try {
        const product = await Product.findById(productId); // Fetch the product by ID
        res.render('editproduct', { product: product });
    } catch (err) {
        res.status(500).send("Error fetching product details.");
    }
});

// Update Product (POST)
app.post('/updateproduct', async (req, res) => {
    const { productId, name, price, offer, detail, email } = req.body;
    try {
        await Product.findByIdAndUpdate(productId, { name, price, offer, detail, email });
        res.redirect('/shopkeeper'); // Redirect back to the shopkeeper page
    } catch (err) {
        res.status(500).send("Error updating product.");
    }
});
////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//////////////add to cart/////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
app.post('/add-to-cart/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const useremail = parmanentemail; // Ensure this is defined properly

        // Check if the product already exists in the cart for the user
        const existingCartItem = await Cart.findOne({
            name: product.name,
            email: product.email,
            useremail: useremail
        });

        if (existingCartItem) {
            // If the item exists, increase its quantity by 1
            existingCartItem.quantity += 1;
            await existingCartItem.save();
            console.log('Product quantity increased in cart');
        } else {
            // If the item does not exist, add a new entry
            const newCart = new Cart({
                productId:product._id,
                name: product.name,
                price: product.price,
                offer: product.offer,
                email: product.email,
                useremail: useremail,
                quantity: 1 , // Initialize quantity as 1
                imageUrl:product.images[0]
            });

            await newCart.save();
            console.log('Product added to cart successfully');
        }

        return res.json({ success: true });

    } catch (err) {
        console.error('Error adding product to cart:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/cart', async(req, res) => {
    if (parmanentemail==null) {
        // If no user session exists, redirect to the signup page
        return res.redirect('/signup');
    }
    const user = await Cart.find({ useremail: { $regex: `^${parmanentemail}$`, $options: 'i' } });
    let total=0;
    user.forEach(product=>total+=product.price*product.quantity)
    const products =  user;
    res.render('cart', { products,total });
});
 
///////////+-+-+-+-+-///////////////////////////////////////////////////
app.post('/update-quantity/:productName/:email/:useremail/:action', async (req, res) => {
    try {
        const { productName, email, useremail, action } = req.params;

        let cartItem = await Cart.findOne({ name: productName, email, useremail });

        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        if (action === "increase") {
            cartItem.quantity += 1;
        } else if (action === "decrease") {
            if (cartItem.quantity > 1) {
                cartItem.quantity -= 1;
            } else {
                await Cart.deleteOne({ _id: cartItem._id });
                return res.json({ success: true, newQuantity: 0, newTotal: await calculateTotal(useremail) });
            }
        }

        await cartItem.save();

        res.json({ success: true, newQuantity: cartItem.quantity, newTotal: await calculateTotal(useremail) });

    } catch (err) {
        console.error("Error updating quantity:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.delete('/delete-product/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const deletedProduct = await Cart.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        // Calculate new total after deletion
        const newTotal = await calculateTotal(deletedProduct.useremail);

        return res.json({ success: true, newTotal });

    } catch (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Function to calculate the total price
async function calculateTotal(useremail) {
    const cartItems = await Cart.find({ useremail });
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

}
/////////////shoppingdetail///////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
app.get('/shoppingdetail', (req, res) => {
    res.render('shoppingdetail', { errorMessage: null });
});

app.post('/shoppingdetail', async (req, res) => {
    const { number, location,discription } = req.body;
    
    
    try {
        const users = await Cart.find({ useremail: { $regex: `^${parmanentemail}$`, $options: 'i' } });

        if (users.length === 0) {
            console.log("No users found matching the email pattern.");
            return res.status(404).send("No users found.");
        }
        const orders = users.map(item => ({
            productId:item.productId,
            name:item.name,
            price:item.price,
            offer:item.offer,
            email: item.email,
            useremail:parmanentemail,
            quantity: item.quantity,
            imageUrl:item.imageUrl,
            status:'order confirmed',
            timestamp: moment().tz("Asia/Kolkata").toDate() ,
        }));
        let total=0;
        users.forEach(product=>total+=product.price*product.quantity);
        // 🔹 Insert all orders in a single operation
        await Order.insertMany(orders);
        // 🔹 Add all users' data with the current timestamp
        const Entries = users.map(user => ({
            productId: new mongoose.Types.ObjectId(user.productId), // Ensure ObjectId format
            quantity: user.quantity,
            timestamp: moment().tz("Asia/Kolkata").toDate() ,

        }));
        
        const newShoppingdetail = new Shoppingdetail({
            email:parmanentemail,
            number: number,
            location:location,
            discription:discription,
            total:total,
            products: Entries,
           
        });

      
        await newShoppingdetail.save();
        console.log('User registered successfully');
        
        await Cart.deleteMany({ useremail: { $regex: `^${parmanentemail}$`, $options: 'i' } });
        console.log('Cart items deleted successfully');

        res.redirect('/success');
    } catch (err) {
        // Log and display the error for easier debugging
        console.error('Error inserting document:', err);
        res.status(500).send(`Error inserting document: ${err.message}`);
    }
});

app.get('/success', async (req, res) => {
    try {
            
        const lastEntry = await Shoppingdetail.find({ email: { $regex: `^${parmanentemail}$`, $options: 'i' } });
           const n=lastEntry.length;
        const totalprice=lastEntry[n-1].total;
        if (lastEntry) {
            res.render('success', { totalprice });
        } else {
            res.send('No shopping details found for the given email.');
        }
    } catch (error) {
        console.error('Error fetching last shopping detail:', error);
        res.send('An error occurred while fetching data.');
    }
});



app.get('/order', async(req, res) => {
    if (parmanentemail==null) {
        // If no user session exists, redirect to the signup page
        return res.redirect('/signin');
    }
    const user = await Order.find({ useremail: { $regex: `^${parmanentemail}$`, $options: 'i' } });
    
    
    const products =  user;
    res.render('order', { products });
});
 


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Closed all connections');
      process.exit(0);
    });
  });