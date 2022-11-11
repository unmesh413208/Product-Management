const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const jwt = require('jsonwebtoken')
const { keyValue, objectValue, isValidObjectId, validQuantity } = require("../middleware/validator");  // IMPORTING VALIDATORS


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////       CREATE        CART          API       /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createCart = async function (req, res) {
  try {
    //request userId from path params
    const userId = req.params.userId;
    //userIdId validation => userIdId is valid ObjcetId or not
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });

    // Destructuring
    let { quantity, productId, cartId } = req.body;

    //request body validation => request body must not be empty
    if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide valid request body!" });

    //productId validation => productId is valid ObjcetId or not
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please provide valid Product Id!" });

    //quantity validation => if not given in request body, consider 1
    if (!quantity) {
      quantity = 1;
    }
    else {
      //quantity must be a valid number and greater than 1
      if (!validQuantity(quantity)) return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero!" });
    }

    //DB call => find user from userModel by userId
    const findUser = await userModel.findById({ _id: userId });
    //user not found in DB
    if (!findUser) {
      return res.status(404).send({ status: false, message: `User doesn't exist by ${userId}!` });
    }

    //DB call => find product from productModel by productId
    const findProduct = await productModel.findById({ _id: productId });
    //product not found in DB
    if (!findProduct) {
      return res.status(404).send({ status: false, message: `Product doesn't exist by ${productId}!` });
    }

    //cart validation => if cartId given in request body 
    if (cartId) {
      //cartId must be a valid objectId
      if (!isValidObjectId(cartId)) {
        return res.status(400).send({ status: false, message: "Please provide valid cartId!" });
      }
      //Unique cart Validation => checking from DB that cart present in DB or not
      let duplicateCart = await cartModel.findOne( {userId : userId} )
      //cart not present in the DB
      if (!duplicateCart) {
        return res.status(404).send({ status: false, message: "cart does not exists!" })
      }
    }
    //if cartId not given in request body
    //DB call => find cart from cartModel by userId
    const findCartOfUser = await cartModel.findOne( {userId : userId} )
    //if cart not found for user
    if (!findCartOfUser) {
      //create cart for the user
      // Destructuring
      let cartData = {
        userId: userId,
        items: [
          {
            productId: productId,
            quantity: quantity,
          },
        ],
        totalPrice: findProduct.price * quantity,
        totalItems: 1,
      };
      //Create cart for the user and store in DB
      const createCart = await cartModel.create(cartData);
      //successfull creation of a new cart for user response
      return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
    }

    //if cart found in DB for the user
    if (findCartOfUser) {
      // price update => previously present price sum with newly added product price with respect to their quantity 
      let price = findCartOfUser.totalPrice + quantity * findProduct.price;
      //declare a array by select items from cart
      let arr = findCartOfUser.items;
      //add new product to the cart and also update previously present product count
      for (i in arr) {
        ///chaecking product by productId from cart and also from request body
        if (arr[i].productId.toString() === productId) {
          //update quantity by adding new quantity
          arr[i].quantity += quantity;
          //arr[i].quantity= quantity+1
          // Destructuring => items, total price and total items
          let updatedCart = {
            items: arr,
            totalPrice: price,
            totalItems: arr.length,
          };

          //DB call and Update => update product details in cart by requested body parameters 
          let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });
          //Successfull upadte products in cart details return response to body
          return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });

        }
      }

      //add products and update cart
      arr.push({ productId: productId, quantity: quantity });
      //Destructuring
      let updatedCart = { items: arr, totalPrice: price, totalItems: arr.length };
      //DB call and Update => update product details in cart by requested body parameters
      let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });
      //Successfull upadate products in cart details return response to body
      return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
    }
  }
  catch (error) {
    res.status(500).send({ status: false, data: error.message });
  }
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////       UPDATE        CART          API       /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateCart = async function (req, res) {
  try {
    //request userId from path params
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });  

    //Destructuring
    const { cartId, productId, removeProduct } = req.body

    //request body validation => request body must not be empty
    if (!keyValue(req.body)) { return res.status(400).send({ status: false, message: "Please provide something to update!" }) }

    // CartId Validation => cardId is mandatory
    if (!objectValue(cartId)) return res.status(400).send({ status: false, message: "Please enter cartId!" })
    //cartId must be a valid objcetId
    if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please enter valid cartId!" })

    //DB call => find cart from carttModel by cartId
    let cart = await cartModel.findOne( {userId : userId} )
    //cart not found in DB
    if (!cart) { return res.status(400).send({ status: false, message: "Cart does not exist in the DB! " }) }
    //cart is blank
    if (cart.items.length == 0) { return res.status(400).send({ status: false, message: "Nothing left to update!" }) }

    //productId validation => productId is mandatory
    if (!objectValue(productId)) return res.status(400).send({ status: false, message: "Please enter productId!" })
    //productId must be a valid objcetId
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId!" })
    //DB call => find product from productModel by productId
    let product = await productModel.findOne({ _id: productId, isDeleted: false })
    //product not found in the DB
    if (!product) { return res.status(404).send({ status: false, message: "Product not found!" }) }

    //remove product validation => remove product must be 0 or 1
    if (!(removeProduct == 1 || removeProduct == 0)) {
      return res.status(400).send({ status: false, message: "please mention 1 or 0 only in remove product" })
    }

    //declare variables
    let cartItems
    let productQuantity
    let productItems
    let allPrice
    let allItems

    //if removeProduct equal to 1
    if (removeProduct == 1) {
      cartItems = cart.items
      // array of items
      for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].productId == productId) {
          // decreasing quantity of product -1
          productQuantity = cartItems[i].quantity - 1
          cartItems[i].quantity = productQuantity
          // updated total price after remove the product from cart
          allPrice = cart.totalPrice - product.price;

          if (cartItems[i].quantity == 0) {
            cartItems.splice(i, 1)         
            //decrease the product count on successfull remove product
            // only  if item quantity will become zero, totalItems will -1
            productItems = cart.totalItems - 1
            allItems = productItems
          }
          break;
        }
      }
      // if there will be no item in cart 
      if (cartItems.length == 0) { allPrice = 0; allItems = 0 };

      //DB call and Update => update product details by requested body parameters 
      let updatedProduct = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: cartItems, totalPrice: allPrice, totalItems: allItems }, { new: true })
      //Successfull upadate products in cart details return response to body
      return res.status(200).send({ status: true, message: "Success", data: updatedProduct })

    }

    //if removeProduct equal to 0
    if (removeProduct == 0) {
      cartItems = cart.items
      // array of items
      for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].productId == productId) {
          //deducting products price from total price
          allPrice = cart.totalPrice - (product.price * cartItems[i].quantity)
          // decreasing totalItems quantity by 1     
          allItems = cart.totalItems - 1
          // deleting product from items array            
          cartItems.splice(i, 1)
          break;
        }
      }

    }
    // if items array will become empty
    if (cartItems.length == 0) { allPrice = 0; allItems = 0 };
    //DB call and Update => update product details by requested body parameters         
    let updatedProduct = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: cartItems, totalPrice: allPrice, totalItems: allItems }, { new: true })                                                         // updated
    //Successfull upadate products in cart details return response to body
    return res.status(200).send({ status: true, message: "Success", data: updatedProduct })
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, msg: "Error", error: err.message })
  }
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////      GET       CART       DETAILS       API       /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getCartDetails = async (req, res) => {
  try {
    //request userId from path params
    const userId = req.params.userId
    //userId must be a valid objectId
    if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "userId is invalid!" }) }    // 1st V used here 

    //DB Call => find cart details by userId from cartModel
    const findCartOfUser = await cartModel.findOne( {userId : userId} )
    //cart not found in DB
    if (!findCartOfUser) { return res.status(404).send({ status: false, message: "Cart not found or does not exist!" }) }
    //Successfull execution response with cart Details
    res.status(200).send({ status: true, message: "Cart Details", data: findCartOfUser })

  }
  catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////      GET       CART       DETAILS       API       /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const deleteCart = async (req, res) => {
  try {
    //request userId from path patrams
    const userId = req.params.userId
    //userId must be a valid objectId
    if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "userId is invalid!" }) }   // 1st V used here

    //DB Call => find cart details by userId from cartModel
    const findCartOfUser = await cartModel.findOne( {userId : userId} )
    //cart not found in DB
    if (!findCartOfUser) { return res.status(404).send({ status: false, message: "Cart not found or does not exist!" }) }

      //DB call and Update => update isDeleted as true
      await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })
      res.status(200).send({ status: true, message: "Cart has been deleted successfully!" })
      
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}


// Destructuring & Exporting
module.exports = { createCart, updateCart, getCartDetails, deleteCart }  
