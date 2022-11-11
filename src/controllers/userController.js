const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const aws = require("../aws/s3")

const { objectValue, nameRegex, keyValue, mobileRegex, emailRegex, passwordRegex, pincodeRegex, isValidObjectId } = require("../middleware/validator"); // IMPORTING VALIDATORS



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////       CREATE    USER     API      //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createUser = async (req, res) => {
    try {
        const address = req.body.address
        // Destructuring
        let { fname, lname, email, phone, password } = req.body

        // Request body validation => empty or not
        if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide details!" })

        //first name validation => first name is mandatory
        if (!objectValue(fname)) return res.status(400).send({ status: false, message: "Please enter first name!" })
        //first name must be in alphabate
        if (!nameRegex(fname)) return res.status(400).send({ status: false, message: "first name is invalid!" })

        //last name validation => last name is mandatory
        if (!objectValue(lname)) return res.status(400).send({ status: false, message: "Please enter last name!" })
        //last name must  be in alphabate
        if (!nameRegex(lname)) return res.status(400).send({ status: false, message: "last name is invalid!" })

        //Email validation => Email is mandatory
        if (!objectValue(email)) return res.status(400).send({ status: false, message: "Please enter email!" })
        //Email must be a valid email address 
        if (!emailRegex(email)) return res.status(400).send({ status: false, message: "email is invalid!" })
        // Email must be unique => checking from DB that email already registered or not
        let duplicateEmail = await userModel.findOne({ email })
        if (duplicateEmail) return res.status(404).send({ status: false, message: "email is already registered!" })

        //upload Profile Image(a file) by aws in S3
        // request profile image from body
        let files = req.files
        let uploadFileURL;
        //check file of profileImage
        if (files && files.length > 0) {
            //upload file to S3 of AWS
            uploadFileURL = await aws.uploadFile(files[0])
        }
        else {
            return res.status(400).send({ status: false, message: "Please add profile image" })
        }
        //store the URL where profile image uploaded in a variable (AWS Url)
        let profileImage = uploadFileURL

        //phone number validation => phone is number mandatory
        if (!objectValue(phone)) return res.status(400).send({ status: false, message: "Please enter phone number!" })
        //phone number must be a valid indian phone number
        if (!mobileRegex(phone)) return res.status(400).send({ status: false, message: "phone number is invalid!" })
        //phone must must be unique => checking from DB that phone number already registered or not
        let duplicatePhone = await userModel.findOne({ phone })
        if (duplicatePhone) return res.status(404).send({ status: false, message: "phone number is already registered!" })

        //Password validation => password is mandatory
        if (!objectValue(password)) return res.status(400).send({ status: false, message: "Please enter password!" })
        //Password must be 8-50 characters 
        if (!passwordRegex(password)) return res.status(400).send({ status: false, message: "Password must be 8 to 15 characters and in alphabets and numbers only!" })
        //creating hash password by using bcrypt
        const passwordHash = await bcrypt.hash(password, 10);
        password = passwordHash


        // Address validation => address is mandatory
        if (!objectValue(address)) return res.status(400).send({ status: false, message: "Please enter your address!" })

        // shipping address validation
        if (!objectValue(address.shipping)) return res.status(400).send({ status: false, message: "Please enter your shipping address!" })
        if (!objectValue(address.shipping.street)) return res.status(400).send({ status: false, message: "Please enter your shipping street!" });
        if (!objectValue(address.shipping.city)) return res.status(400).send({ status: false, message: "Please enter your shipping city!" });
        if (!address.shipping.pincode || isNaN(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Please enter your shipping pincode!" });
        if (!pincodeRegex(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping pincode is invalid!" });

        // billing address validation
        if (!objectValue(address.billing)) return res.status(400).send({ status: false, message: "Please enter your billing address!" });
        if (!objectValue(address.billing.street)) return res.status(400).send({ status: false, message: "Please enter your billing street!" });
        if (!objectValue(address.billing.city)) return res.status(400).send({ status: false, message: "Please enter your billing city!" });
        if (!address.billing.pincode || isNaN(address.billing.pincode)) return res.status(400).send({ status: false, message: "Please enter your billing pincode!" });
        if (!pincodeRegex(address.billing.pincode)) return res.status(400).send({ status: false, message: "Billing pincode is invalid!" });

        // Destructuring
        let users = { fname, lname, email, profileImage, phone, password, address }

        //Create user and store in DB
        const userCreation = await userModel.create(users)
        //successfull creation of a new user response
        res.status(201).send({ status: true, message: 'Success', data: userCreation })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////       LOGIN    USER     API       //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const loginUser = async function (req, res) {
    try {
        // Destructuring
        let { email, password } = req.body

        // Request body validation => empty or not
        if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide email and password!" })

        //Email is mandatory for login
        if (!objectValue(email)) return res.status(400).send({ status: false, message: "email is not present!" })
        //Email must be a valid email address
        if (!emailRegex(email)) return res.status(400).send({ status: false, message: "email is invalid!" })

        //Password validation => Password is mandatory for login
        if (!objectValue(password)) return res.status(400).send({ status: false, message: "password is not present!" })
        //Password must be 8-50 characters 
        if (!passwordRegex(password)) return res.status(400).send({ status: false, message: "Password must be 8 to 15 characters and in alphabets and numbers only!" })

        //Email Validation => checking from DB that email present in DB or not
        let user = await userModel.findOne({ email: email })
        if (!user) return res.status(404).send({ status: false, message: `${email} is not present in the Database!` })

        //password check by comparing request body password and the password from bcrypt hash password
        let passwordCheck = await bcrypt.compare(req.body.password, user.password)
        //request body password and bcrypt hash password not match
        if (!passwordCheck) return res.status(400).send({ status: false, message: "password is not correct!" })


        //Create Token by jsonwebtoken
        let token = jwt.sign(
            {
                //Payload
                userId: user._id.toString(),
                group: "seventy-three",
                project: "ProductsManagement",
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 480 * 60 * 60
            },
            "group73-project5"              // Secret Key 
        )

        //for successfull login return response userId with generated token to body
        return res.status(201).send({ status: true, data: { userId: user._id, token } })
    }
    catch (err) {
        console.log("This is the error:", err.message)
        return res.status(500).send({ status: false, message: err.message })
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////     GET    USER     DETAILS     BY     USERID      API       ////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getUserDeatailsById = async (req, res) => {

    try {
        //request userId from path params
        const userId = req.params.userId

        //UserId is valid ObjectId or not
        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "userId is invalid!" }) }

        //DB Call => find by userId from userModel
        let findUsersbyId = await userModel.findOne({ _id: userId })
        //user not found in DB
        if (!findUsersbyId) { return res.status(404).send({ status: false, message: "User details not found or does not exist!" }) }

        //Successfull execution response with userDetails
        res.status(200).send({ status: true, data: findUsersbyId })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////       UPDATE   USER     DETAILS     BY       ID      API       //////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateUserDetails = async function (req, res) {
    try {
        //request userId from path params
        const userId = req.params.userId;

        const address = req.body.address

        //userId validation => userId is valid ObjcetId or not
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid!" })

        //DB call => find by userId from userModel
        let findUsersbyId = await userModel.findOne({ _id: userId })
        //user not found in DB
        if (!findUsersbyId) { return res.status(404).send({ status: false, message: "User details not found or does not exist!" }) }

        let { fname, lname, email, phone, password, profileImage } = req.body;  // Destructuring

        //upload profile image(a file) by aws
        //request profile image from body
        let files = req.files
        let uploadFileURL;
        //check file of profileImage 
        if (files && files.length > 0) {
            //upload file to S3 of AWS
            uploadFileURL = await aws.uploadFile(files[0])
            //store the URL where profile image uploaded in a variable (AWS Url)
            profileImage = uploadFileURL
        }

        //valid parameters are given to update user details or not 
        if (!(fname || lname || email || phone || password || address || profileImage)) {
            return res.status(400).send({ status: false, message: "Please input valid params to update!" });
        }

        //First name Validation => if key present, then value must not be empty
        if (fname) {
            if (!objectValue(fname)) return res.status(400).send({ status: false, message: "Please enter first name!" })
        }

        //last name validation =>  if key present, then value must not be empty
        if (lname) {
            if (!objectValue(lname)) return res.status(400).send({ status: false, message: "Please enter last name!" })
        }

        //email validation if present
        if (email) {
            //if key present then value must not be empty
            if (!objectValue(email)) return res.status(400).send({ status: false, message: "Please enter email!" })
            // email is  valid email address or not  
            if (!emailRegex(email)) return res.status(400).send({ status: false, message: "email is invalid!" })
            //Unique Email Validation => checking from DB that email present in DB or not    
            let duplicateEmail = await userModel.findOne({ email })
            //email already used
            if (duplicateEmail) return res.status(404).send({ status: false, message: "email is already in use!" })
        }

        //Phone number validation if present
        if (phone) {
            //if Key present then value must not be empty
            if (!objectValue(phone)) return res.status(400).send({ status: false, message: "Please enter email!" })
            // phone number is valid Indian phone number or not
            if (!mobileRegex(phone)) return res.status(400).send({ status: false, message: "phone number is invalid!" })
            //Unique phone number Validation => checking from DB that phone number present in DB or not 
            let duplicatePhone = await userModel.findOne({ phone })
            //phone no already used
            if (duplicatePhone) return res.status(404).send({ status: false, message: "Phone number is already in use!" })
        }

        //Password validation
        if (password) {
            //if key present then value must not be empty
            if (!objectValue(password)) return res.status(400).send({ status: false, message: "Please enter password!" })
            ////Password must be 8-50 characters 
            if (!passwordRegex(password)) return res.status(400).send({ status: false, message: "Password must be 8 to 15 characters!" })
            //creating hash password by using bcrypt
            const passwordHash = await bcrypt.hash(password, 10);
            password = passwordHash
        }

        // Address validation => if key is present then value must not be empty
        if (address) {
            if (!objectValue(address)) return res.status(400).send({ status: false, message: "Please enter your address!" })

            // shipping address validation
            if (address.shipping) {
                let Shipping = address.shipping
                if (!objectValue(Shipping)) return res.status(400).send({ status: false, message: "Please enter your shipping address!" })
                if (Shipping.street) {
                    if (!objectValue(Shipping.street)) return res.status(400).send({ status: false, message: "Please enter your shipping street!" });
                }
                if (Shipping.city) {
                    if (!objectValue(Shipping.city)) return res.status(400).send({ status: false, message: "Please enter your shipping city!" });
                }
                if (Shipping.pincode) {
                    if (!Shipping.pincode || isNaN(Shipping.pincode)) return res.status(400).send({ status: false, message: "Please enter your shipping pincode!" });
                    if (!pincodeRegex(Shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping pincode is invalid!" });
                }
            }

            // billing address validation
            if (address.billing) {
                let Billing = address.billing
                if (!objectValue(Billing)) return res.status(400).send({ status: false, message: "Please enter your billing address!" })
                if (Billing.street) {
                    if (!objectValue(Billing.street)) return res.status(400).send({ status: false, message: "Please enter your billing street!" });
                }
                if (Billing.city) {
                    if (!objectValue(Billing.city)) return res.status(400).send({ status: false, message: "Please enter your billing city!" });
                }

                if (Billing.pincode) {
                    if (!Billing.pincode || isNaN(Billing.pincode)) return res.status(400).send({ status: false, message: "Please enter your billing pincode!" });
                    if (!pincodeRegex(Billing.pincode)) return res.status(400).send({ status: false, message: "Billing pincode is invalid!" });
                }
            }
        }

        //DB call and Update => update user details by requested body parameters 
        const updatedUserDetails = await userModel.findOneAndUpdate(
            { _id: userId },
            { $set: { fname, lname, email, phone, password, address, profileImage } },
            { new: true }
        );
        //Successfull upadte user details return response to body
        return res.status(200).send({ status: true, message: 'Success', data: updatedUserDetails });

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};


// Destructuring & Exporting modules
module.exports = { createUser, loginUser, getUserDeatailsById, updateUserDetails }  