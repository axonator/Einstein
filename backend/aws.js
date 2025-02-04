const AWS = require('aws-sdk');

// Configure the S3 Client with your region
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function uploadFileToS3(fileBuffer, fileName, s3UploadPrefix, contentType) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // Your S3 bucket name
    Key: `${s3UploadPrefix}${fileName}`, // The file path on S3
    Body: fileBuffer,  // The actual file buffer
    ACL: 'public-read',  // Public read permissions for the uploaded file
    ContentType: contentType,  // Content type (MIME type) of the file
  };

  console.log("Uploading to S3 with params:", params);

  try {
    // Upload the file to S3
    const data = await s3.putObject(params).promise();
    console.log("Upload success:", data);
    
    // Return the URL of the uploaded file
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${s3UploadPrefix}${fileName}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return null;
  }
}

module.exports = { uploadFileToS3 };
