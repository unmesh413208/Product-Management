const express = require("express")
const route = express.Router();
const { createUser, loginUser, getUserDeatailsById, updateUserDetails } = require("../controllers/userController");
const { createProduct, getProducts, getProductsbyId, updateProduct, deleteProductsbyId } = require("../controllers/productController");
const { createCart, updateCart, getCartDetails, deleteCart } = require("../controllers/cartController");
const { createOrder, updateOrder } = require("../controllers/orderController");
const { authentication, authorisation } = require("../middleware/auth")


//******************* USERS APIs ***************************// 
route.post("/register", createUser)
route.post("/login", loginUser)
route.get("/user/:userId/profile", authentication, authorisation, getUserDeatailsById)
route.put("/user/:userId/profile", authentication, authorisation, updateUserDetails)

//******************* PRODUCTS APIs ***************************// 
route.post("/products", createProduct)
route.get("/products", getProducts)
route.get("/products/:productId", getProductsbyId)
route.put("/products/:productId", updateProduct)
route.delete("/products/:productId", deleteProductsbyId)

//******************* CARTS APIs ***************************// 
route.post("/users/:userId/cart", authentication, authorisation, createCart)
route.put("/users/:userId/cart", authentication, authorisation, updateCart)
route.get("/users/:userId/cart", authentication, authorisation, getCartDetails)
route.delete("/users/:userId/cart", authentication, authorisation, deleteCart)


//******************* ORDERS APIs ***************************// 
route.post("/users/:userId/orders", authentication, authorisation, createOrder)
route.put("/users/:userId/orders", authentication, authorisation, updateOrder)


module.exports = route
