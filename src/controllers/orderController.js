const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const userModel = require("../models/userModel");
const { keyValue, isValidObjectId, objectValue } = require("../middleware/validator");  // IMPORTING VALIDATORS


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////       CREATE      ORDER         API       ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createOrder = async function (req, res) {
  try {
    //request userId from path params
    const { userId } = req.params
    //userId must be a valid objectId
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });

    // Destructuring
    const { cartId, status, cancellable } = req.body
    //request body must not be empty
    if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please enter something!" });

    //cartId validation => cartId is mandatory and must not be empty
    if (!objectValue(cartId)) return res.status(400).send({ status: false, message: "Please provide cartId!" });
    //cartId must be a valid objectId
    if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please provide valid cartId!" });

    //DB call => find cart details from cartModel by userId and cartId
    const cartItems = await cartModel.findOne({ _id: cartId, userId: userId, isDeleted: false })
    //userId not present in the DB
    if (cartItems.userId != userId) return res.status(404).send({ status: false, message: `${userId} is not present in the DB!` });
    // cart not present in the DB or empty
    if (!cartItems) return res.status(400).send({ status: false, message: "Either cart is empty or does not exist!" });

    //products quantity update
    let items = cartItems.items
    let totalQuantity = 0
    for (let i = 0; i < items.length; i++) {
      totalQuantity += items[i].quantity
    }
    // cancellable validation => if key is present value must not be empty
    if (cancellable) {
      //cancellable must be true or false
      if (cancellable !== true || false) {
        return res.status(400).send({ status: false, message: "Cancellable can be either true or false!" });
      }
    }

    // status validation => if key is present value must not be empty
    if (status) {
      //status must be pending or completed or canceled
      if (status !== "pending" || "completed" || "cancled") {
        return res.status(400).send({ status: false, message: "Status can be either pending or completed or cancled!" });
      }
    }

    // Destructuring
    let order = { userId: userId, items: cartItems.items, totalPrice: cartItems.totalPrice, totalItems: cartItems.totalItems, totalQuantity: totalQuantity, cancellable: cancellable, status: status }

    //Create order for the user and store in DB
    let orderCreation = await orderModel.create(order)
    //update cart on successfully complition of order and set cart as empty
    await cartModel.findOneAndUpdate({ userId: userId, isDeleted: false }, { $set: { items: [], totalPrice: 0, totalItems: 0 } })
    //Successfull oreder details return response to body
    return res.status(201).send({ status: true, message: `Order created successfully`, data: orderCreation });
  }
  catch (error) {
    res.status(500).send({ status: false, data: error.message });
  }
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////       UPDATE      ORDER         API       ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateOrder = async function (req, res) {
  try {
    let userId = req.params.userId.trim()
    let { orderId, status } = req.body

    if (!isValidObjectId(orderId)) {
      return res.status(400).send({ status: false, message: `${orderId} not a object id` })
    }
    if (req.body.cancellable) {
      return res.status(400).send({ status: false, message: "this feature(cancellable ) is not available right now" })
    }
    let userCheck = await userModel.findOne({ _id: userId })
    if (!userCheck) {
      return res.status(404).send({ status: false, message: "user id doesn't exist" })
    }
    let orderCheck = await orderModel.findOne({ _id: orderId })
    if (!orderCheck) {
      return res.status(404).send({ status: false, message: "order is not created " })
    }
    if (orderCheck.userId.toString() !== userCheck._id.toString()) {
      return res.status(404).send({ status: false, message: `order is not for ${userId}, you cannot order it  ` })
    }

    if (orderCheck.cancellable == false) {
      if (status == "canceled") {
        return res.status(400).send({ status: false, message: `you cannot canceled this order ` })
      }
      if (status != "completed") {
        return res.status(400).send({ status: false, message: `this order can only be completed` })
      }
    }
    else if (orderCheck.status == "completed") {
      //
      if (status == "pending") {
        return res.status(400).send({ status: false, message: "this can only be completed !!cannot make it pending" })
      }
      if (status == "canceled") {
        return res.status(400).send({ status: false, message: "this can only be completed !!cannot make it canceled" })
      }
    } else if (orderCheck.status == "canceled") {
      if (status != "canceled") {
        return res.status(400).send({ status: false, message: "this has canceled please create a oreder" })
      }
    }
    else {
      let sts = ["completed", "canceled"]
      if (sts.includes(status) == false) {
        return res.status(400).send({ status: false, message: "this can only be completed or canceled" })
      }
    }

    orderCheck.status = status
    if (req.body.isDeleted == Boolean) {
      orderCheck.isDeleted = req.body.isDeleted
      if (req.body.isDeleted == true) {
        orderCheck.deletedAt = new Date.now()
      }

    }
    let updateOrder = await orderModel.findByIdAndUpdate({ _id: orderId }, orderCheck, { new: true })
    updateOrder = { ...updateOrder.toObject() }
    updateOrder.items.map(x => delete x._id)
    res.status(201).send({ status: true, message: "Success", data: updateOrder })
  }
  catch (error) {
    res.status(500).send({ status: false, message: error.message })
    console.log(error)
  }

}

// Destructuring & Exporting
module.exports = { createOrder, updateOrder }








