const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Configure the S3 Client with your region
const s3Client = new S3Client({ 
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
 });

async function uploadFileToS3(fileBuffer, fileName, s3UploadPrefix, contentType) {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${s3UploadPrefix}${fileName}`,
        Body: fileBuffer,
        ACL: "public-read", // Set the correct permissions if needed
        ContentType: contentType, // Change as per file type
      };

    try {
        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);
        const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${s3UploadPrefix}${fileName}`;
        return fileUrl;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        return null;
    }
}

module.exports = { uploadFileToS3 };
