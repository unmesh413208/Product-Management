const productModel = require("../models/productModel");
const aws = require("../aws/s3")
const { objectValue, keyValue, numberValue, isValidObjectId, strRegex, isValidEnum } = require("../middleware/validator")  // IMPORTING VALIDATORS



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////      CREATE     PRODUCT     API      //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createProduct = async (req, res) => {
  try {
    // Destructuring
    const { title, description, price, currencyId, currencyFormat, isFreeShipping, availableSizes, style, installments, isDeleted } = req.body

    // Request body validation => empty or not
    if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide details!" })

    //upload product image(a file) by aws in S3
    // request product image from body
    let files = req.files
    let uploadFileURL;
    //check file of productImage
    if (files && files.length > 0) {
      //upload file to S3 of AWS
      uploadFileURL = await aws.uploadFile(files[0])
    }
    else {
      return res.status(400).send({ status: false, message: "Please add product image" })
    }
    //store the URL where product image uploaded in a variable (AWS Url)
    let productImage = uploadFileURL

    //Title validation => product title is mandatory
    if (!objectValue(title)) return res.status(400).send({ status: false, message: "Please enter title!" })
    //title must be in alphabate only
    if (!strRegex(title)) return res.status(400).send({ status: false, message: "Please enter title in alphabets only!" })
    // product title must be unique => checking from DB that product already present in database or not
    let duplicateTitle = await productModel.findOne({ title })
    if (duplicateTitle) return res.status(404).send({ status: false, message: "title is already in use!" })

    //Product description validation => description is mandatory
    if (!objectValue(description)) return res.status(400).send({ status: false, message: "Please enter description!" })

    //Price Validation => price is mandatory
    if (!price) return res.status(400).send({ status: false, message: "Please enter price!" })
    if (price) {
      if (!numberValue(price)) return res.status(400).send({ status: false, message: "Please enter price!" })
    }

    // CurrencyId validation => if key is present then value must not be empty
    if (currencyId) {
      if (!objectValue(currencyId)) return res.status(400).send({ status: false, message: "Please enter currencyId!" })
      // currenctId must be "INR" only
      if (currencyId !== "INR") return res.status(400).send({ status: false, message: "Please enter currencyId in correct format!" })
    }

    // CurrencyFormat validation => if key is present then value must not be empty
    if (currencyFormat) {
      if (!objectValue(currencyFormat)) return res.status(400).send({ status: false, message: "Please enter currencyFormat!" })
      //currencyFormat must be "₹" only
      if (currencyFormat !== "₹") return res.status(400).send({ status: false, message: "Please enter currencyFormat in correct format!" })
    }

    //isFreeShipping Validation => if key is present then value must not be empty and in boolean only
    if (isFreeShipping || isFreeShipping === "") {
      if (isFreeShipping !== true || false) return res.status(400).send({ status: false, message: "Please enter isFreeShipping in correct format!" })
    }

    // availableSizes validation
    let availableSize
    // availableSizes are mendatory
    if (!availableSizes) return res.status(400).send({ status: false, message: "Please enter atleast one available size!" })
    if (availableSizes) {
      //covert availableSizes into upper case and split then with comma 
      availableSize = availableSizes.toUpperCase().split(",")
      console.log(availableSize)  
      //availableSizes must be in enum (["S", "XS", "M", "X", "L", "XXL", "XL"])
      for (let i = 0; i < availableSize.length; i++) {
        //in enum or not checking for availableSizes
        if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i])) {
          return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
        }
      }
    }

    // Style validation => if key is present then value must not be empty
    if (style) {
      if (!objectValue(style)) return res.status(400).send({ status: false, message: "Please enter style!" })
    }

    // installments validation => if key is present then value must not be empty
    if (installments === "") {
      if (!numberValue(installments)) return res.status(400).send({ status: false, message: "Please enter installments!" })
    }

    //isDeleted validation => if key is present then value must be false
    if (isDeleted === true || isDeleted === "") return res.status(400).send({ status: false, message: "isDeleted must be false!" })

    // Destructuring
    const products = { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, availableSizes: availableSize, style, installments, isDeleted }

    //Create product and store in DB
    const productCreation = await productModel.create(products)
    //successfull creation of products response
    res.status(201).send({ status: true, message: 'Success', data: productCreation })

  }
  catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////      GET     PRODUCTS      API     ////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getProducts = async (req, res) => {
  try {
    const productQuery = req.query;
    // Object Manupulation
    const filter = { isDeleted: false };
    // Destructuring  
    const { size, name, priceGreaterThan, priceLessThan, priceSort } = productQuery;

    //size validation
    if (objectValue(size)) {
      const sizeArray = size.trim().split(",").map((s) => s.trim())
      // The "$all" operator selects the documents where the value of a field is an array that contains all the specified elements.
      filter.availableSizes = { $all: sizeArray }
    };

    //product name validation
    if (name) {
      productQuery.title = name
      // product name validation => if key is present then value must not be empty
      if (!objectValue(name)) { return res.status(400).send({ status: false, message: "Product name is invalid!" }) }
      // product name must be in alphabate only
      if (!strRegex(name)) { return res.status(400).send({ status: false, message: "Please enter Product name is alphabets only!" }) }
      filter.title = name.trim()
    }

    // product filter by price greatherThan the given price
    if (priceGreaterThan) 
    filter.price = { $gt: priceGreaterThan }
    // product filter by price lessThan the given price
    if (priceLessThan) 
    filter.price = { $lt: priceLessThan }

    // product filter by both greatherThan and lessThan price
    if (priceGreaterThan && priceLessThan) {
      filter.price = { $gte: priceGreaterThan, $lte: priceLessThan }
    }

    if (objectValue(priceSort)) {
      if (!(priceSort == 1 || priceSort == -1)) {
          return res.status(400).send({ status: false, msg: "we can only sort price by value 1 or -1!" })
      }
    }
    else {
      return res.status(400).send({ status: false, msg: "enter valid priceSort of 1 or -1 to filter products!" })
    }

        //DB call => select product from DB by price filter sort the product min price to max price
        const productList = await productModel.find(filter).sort({ price: priceSort })

        // no produt found by price filter
        if (productList.length === 0) return res.status(404).send({ status: false, message: "no product found!" })

        //Successfull execution response with productDetails
        res.status(200).send({ status: true, message: 'Product list', data: productList })

  }
  catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////      GET     PRODUCTS      By     ID    API     //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getProductsbyId = async (req, res) => {

  try {
    //request productId from path params
    const productId = req.params.productId
    //productId is valid ObjectId or not
    if (!isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "productId is invalid!" }) }

    //DB call => find by productId from productModel
    const findProductsbyId = await productModel.findOne({ _id: productId, isDeleted: false })
    //product not found in DB
    if (!findProductsbyId) { return res.status(404).send({ status: false, message: "Products not found or does not exist!" }) }

    //Successfull execution response with productDetails
    res.status(200).send({ status: true, message: 'Product Details', data: findProductsbyId })
  }
  catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////      UPDATE       PRODUCT       API     //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateProduct = async function (req, res) {
  try {
    //request productId from path params
    const productId = req.params.productId;
    //productId validation => productId is valid ObjcetId or not
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "productId is invalid!" })

    //BD call => find by productId from productModel
    const findProductsbyId = await productModel.findOne({ _id: productId, isDeleted: false })
    //product not found in DB
    if (!findProductsbyId) { return res.status(404).send({ status: false, message: "Products not found or does not exist!" }) }

    // Destructuring
    const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, installments } = req.body
    let availableSizes = req.body.availableSizes

    //something given to update product details or not 
    if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide valid field to update!" });

    //upload product image(a file) by aws
    let files = req.files
    let uploadFileURL;
    //check file of productImage      
    if (files && files.length > 0) {
      //upload file to S3 of AWS
      uploadFileURL = await aws.uploadFile(files[0])
    }
    //store the URL where product image uploaded in a variable (AWS Url)
    let productImage = uploadFileURL

    //valid parameters are given to update product details or not
    if (!(title || description || price || currencyId || currencyFormat || isFreeShipping || availableSizes || style || installments)) {
      return res.status(400).send({ status: false, message: "Please input valid params to update!" })
    }

    //product title validation => if key is present then value must not be empty
    if (title || title === "") {
      if (!objectValue(title)) return res.status(400).send({ status: false, message: "Please enter title!" })
      // product title must be in alphabate only
      if (!strRegex(title)) return res.status(400).send({ status: false, message: "Please enter title in Alphabets only!" })
    }
    // product title must be unique => checking from DB that product already present in database or not
    let duplicateTitle = await productModel.findOne({ title })
    if (duplicateTitle) return res.status(400).send({ status: false, message: "Product name is already in use!" })

    //Product description validation => if key is present then value must not be empty
    if (description) {
      if (!objectValue(description)) return res.status(400).send({ status: false, message: "Please enter description!" })
    }

    //Product price validation => if key is present then value must not be empty
    if (price) {
      if (!numberValue(price)) return res.status(400).send({ status: false, message: "Please enter price correctly!" })
    }

    //currencyId validation => if key is present then value must not be empty
    if (currencyId) {
      if (!objectValue(currencyId)) return res.status(400).send({ status: false, message: "Please enter currencyId!" })
      // currenctId must be "INR" only
      if (currencyId !== "INR") return res.status(400).send({ status: false, message: "Please enter currencyId in correct format!" })
    }

    // currencyFormat validation => if key is present then value must not be empty
    if (currencyFormat) {
      if (!objectValue(currencyFormat)) return res.status(400).send({ status: false, message: "Please enter currencyFormat!" })
      // 2currencyFormat must be "₹" only
      if (currencyFormat !== "₹") return res.status(400).send({ status: false, message: "Please enter currencyFormat in correct format!" })
    }

    // isFreeShipping validation => if key is present then value must not be empty and in boolean only
    if (isFreeShipping || isFreeShipping === "") {
      if (!(isFreeShipping === "true" || "false")) return res.status(400).send({ status: false, message: "Please enter isFreeShipping in correct format!" })
    }

    // availableSizes validation
    if (availableSizes) {
      //availableSizes validation => if key is present then value must not be empty
      if (!(objectValue(availableSizes))) return res.status(400).send({ status: false, message: "Please provide availableSize!" })
      //covert availableSizes into upper case and split then with comma 
      if (availableSizes.toUpperCase().trim().split(",").map(value => isValidEnum(value)).filter(item => item == false).length !== 0)
        return res.status(400).send({ status: false, message: "Sizes should be among 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'!" })
      //availableSizes must be in enum (["S", "XS", "M", "X", "L", "XXL", "XL"])
      let availableSize = availableSizes.toUpperCase().trim().split(",").map(value => value.trim()) //converting in array
      availableSizes = availableSize
    }

    // style validation => if key is present then value must not be empty
    if (style) {
      if (!objectValue(style)) return res.status(400).send({ status: false, message: "Please provide style correctly!" })
    }

    // installments validation => if key is present then value must not be empty
    if (installments) {
      if (!numberValue(installments)) return res.status(400).send({ status: false, message: "Please enter installments correctly!" })
    }

    //DB call and Update => update product details by requested body parameters 
    const updatedProducts = await productModel.findOneAndUpdate(
      { _id: productId },
      { $set: { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, installments, availableSizes } },
      { new: true }
    );
    //Successfull upadte product details return response to body
    return res.status(200).send({ status: true, message: 'Success', data: updatedProducts });

  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////      DELETE      PRODUCT       API     //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const deleteProductsbyId = async (req, res) => {

  try {
    //request productId from path params
    const productId = req.params.productId
    //productId validation => productId is valid ObjcetId or not
    if (!isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "productId is invalid!" }) }   // 1st V used here

    //BD call => find by productId from productModel
    const findProductsbyId = await productModel.findOne({ _id: productId, isDeleted: false })
    //product not found in DB
    if (!findProductsbyId) { return res.status(404).send({ status: false, message: "Products not found or does not exist!" }) }

    //DB call and Update => isDeteled as false
    await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true })

    //Successfull delete product return response to body
    res.status(200).send({ status: true, message: "Product has been deleted successfully!" })
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}

// Destructuring & Exporting
module.exports = { createProduct, getProducts, getProductsbyId, updateProduct, deleteProductsbyId }


