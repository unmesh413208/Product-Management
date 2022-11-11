const aws = require('aws-sdk')


aws.config.update({   //this inbuilt function of aws-sdk that 
  accessKeyId: "AKIAY3L35MCRVFM24Q7U",
  secretAccessKey: "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",
  region: "ap-south-1"
})



let uploadFile = async (file) => {
  return new Promise(function (resolve, reject) {

    //Create S3 service object
    let s3 = new aws.S3({ apiVersion: '2006-03-01' }); //give access to upload the file to s3

    var uploadParams = {
      ACL: "public-read",  //access control list
      Bucket: "classroom-training-bucket",
      Key: "radongroup73/" + file.originalname,
      Body: file.buffer
    }


    s3.upload(uploadParams, function (err, data) {
      if (err) {
        return reject({ "error": err })
      }
      console.log("file uploaded succesfully")
      return resolve(data.Location) //url
    })
  })
}



module.exports.uploadFile = uploadFile