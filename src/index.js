const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const mongoose = require('mongoose');
const app = express();
const multer = require("multer")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());

mongoose.connect("mongodb+srv://Saswath1403:S%40swath9476@cluster0.fjep0.mongodb.net/group73Database-DB", {
    useNewUrlParser: true 
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.use('/', route);


// USING THIS FUNCTION TO HANDLE INVALID ENDPOINTS BY USERS
route.all("/*", function (req, res) {
    res.status(400).send({
        status: false,
        msg: "The api you request is not available!"
    })
})

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});
