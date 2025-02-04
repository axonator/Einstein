const express = require('express');
const multer = require("multer");
const router = express.Router();
const AWS = require("../aws")

// Middleware to set CORS headers for this route
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

  // API route to upload an image
  router.post("/uploadToS3", upload.single("file"), async (req, res) => {
    try {
        console.log("alooooooooooooooooooo",req.file);
        
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const {originalname,mimetype, buffer} = req.file;
      const s3UploadPrefix = req.body.s3UploadPrefix || "Media/";
      
      // Upload to S3
      const fileUrl = await AWS.uploadFileToS3(buffer, originalname, s3UploadPrefix,mimetype);
      
      if (!fileUrl) {
        return res.status(500).json({ error: "Failed to upload file to S3" });
      }

      res.status(200).json({ success: true, fileUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

module.exports = router;
