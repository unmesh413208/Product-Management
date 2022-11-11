const mongoose = require("mongoose");

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<====================  VALIDATORS  ====================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\\

//objectId validation
const isValidObjectId = (objectId) => {
  return mongoose.Types.ObjectId.isValid(objectId);
};
//objectvalue Validation => not (undefined, boolean, number, empty, string, key length=0)
const objectValue = (value) => {
  if (typeof value === "undefined" || value === null || typeof value === "boolean" || typeof value === "number") return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  if (typeof value === "object" && Object.keys(value).length === 0) return false;

  return true;
};

//object keys validation => must be more than 0 
const keyValue = (value) => {
  if (Object.keys(value).length === 0) return false;
  return true;
};

//nameRegax
const nameRegex = (value) => {
  let nameRegex = /^(?![\. ])[a-zA-Z\. ]+(?<! )$/;
  if (nameRegex.test(value)) return true;
};

//emailRegex
const emailRegex = (value) => {
  let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-z\-0-9]+\.)+[a-z]{2,}))$/;
  if (emailRegex.test(value)) return true;
};

// Mobile Number Regex => must be a valid Indian mobile number 
const mobileRegex = (value) => {
  let mobileRegex = /^[6-9]\d{9}$/;
  if (mobileRegex.test(value))
    return true;
}

//password regex => must be 8 to 15 characters and in alphabets and numbers only
const passwordRegex = (value) => {
  let passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,15}$/
    ;
  if (passwordRegex.test(value))
    return true;
}

// pincode regex => must be a valid Indian PIN code
const pincodeRegex = (value) => {
  let pincodeRegex = /^[1-9]{1}[0-9]{5}$/;
  if (pincodeRegex.test(value))
    return true;
}

// string regex
const strRegex = (value) => {
  let strRegex = /^[A-Za-z\s]{0,}[\.,'-]{0,1}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}$/;
  if (strRegex.test(value))
    return true;
}

// array validation
const isValidArray = (value) => {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (value[i].trim().length === 0 || typeof (value[i]) !== "string" || value.trim().length === 0) { return false }
    }
    return true
  } else { return false }
}

//bollean value validation => must be true or false
const booleanValue = (value) => {
  if (typeof value === "undefined" || value === null || typeof value === "number") return false;
  if (typeof value === false && value.toString().trim().length === 0) return false;
  return true;
};

//Number validation => must be number
const numberValue = (value) => {
  if (typeof value === "undefined" || value === null || typeof value === "boolean") return false;
  if (typeof value === "number" && value.toString().trim().length === 0) return false
  return true;
};

//Date validation
const isValidDate = function (date) {
  const isValidDate = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/
  return isValidDate.test(date)
}

// URL Regex 
const urlRegex = (value) => {
  let urlRegex = /(https|http?:\/\/.*\.(?:png|gif|webp|jpeg|jpg))/i;
  if (urlRegex.test(value))
    return true;
}

//number validation
const numberValue2 = (value) => {
  if (typeof value === "undefined" || value === null || typeof value === "boolean" || typeof value === "string") return false;
  if (typeof value === "number" && value.toString().trim().length === 0) return false
  return true;
};


//Validation for Quantity
const validQuantity = function isInteger(value) {
  if (value < 1) return false
  if (value % 1 == 0) return true
}

//available size enum validation
const isValidEnum = function (value) {
  let availableSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
  return availableSizes.includes(value)
}


// Destructuring & Exporting
module.exports = { isValidObjectId, objectValue, nameRegex, emailRegex, keyValue, mobileRegex, passwordRegex, pincodeRegex, isValidArray, booleanValue, numberValue, isValidDate, strRegex, urlRegex, numberValue2, validQuantity, isValidEnum };     // EXPORTING THEM