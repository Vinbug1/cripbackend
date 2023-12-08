const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const  FuncImg  = require('../models/funcImg');
const { Storage } = require('@google-cloud/storage');
 
const storage = new Storage({
    projectId: 'imagekeep-ac687  ', // Replace with your Google Cloud project ID
    keyFilename: './imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json', // Replace with your service account key file path
  });
  
  // Set up Multer for handling file uploads
  const multerStorage = multer.memoryStorage();
  const upload = multer({ storage: multerStorage });

// Upload an image
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
      // Initialize Firebase Admin inside the route handler
    const admin = require('firebase-admin');
    const serviceAccount = require('./imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'gs://imagekeep-ac687.appspot.com', // Replace with your actual Firebase Storage bucket URL
    });

    const bucket = admin.storage().bucket(); // Define bucket here

    // Upload the image to Firebase Storage
    const imageBuffer = req.file.buffer;
    const uniqueFileName = `${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(uniqueFileName);
    const fileStream = file.createWriteStream();

    fileStream.on('error', (err) => {
      console.error(err);
      res.status(500).json({ message: 'Error uploading image' });
    });

    fileStream.on('finish', async () => {
      // Save the image path to MongoDB
      const imagePath = `gs://${bucket.name}/${uniqueFileName}`;
      const newImage = new FuncImg({ path: imagePath });
      await newImage.save();
      res.status(200).json({ message: 'Image uploaded successfully' });
    });

    fileStream.end(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Download an image
router.get('/getImages', async (req, res) => {
    try{
    const images = await FuncImg.find({}, 'path'); // Retrieve only the 'path' field
    const imageUrls = await Promise.all(images.map(async (image) => {
      const gcsPath = image.path.replace(/^gs:\/\/(.*?)\//, ''); // Remove 'gs://' prefix and up to the first '/'
      console.log('gcsPath:', gcsPath); // Log the gcsPath for debugging
      const [publicUrl] = await storage.bucket('imagekeep-ac687.appspot.com').file(gcsPath).getSignedUrl({
        action: 'read',
       // expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
      });
      console.log('publicUrl:', publicUrl); // Log the publicUrl for debugging
      return publicUrl;
    }));
    
    res.json({ images: imageUrls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching images' });
  }
});

// Get all users with their images
router.get('/get-all-users-with-images', async (req, res) => {
    try {
        // Fetch all FuncImg records from the database
        const funcImgs = await FuncImg.find();

        // Prepare an array to store user details with images
        const usersWithImages = [];

        // Iterate over each FuncImg record to fetch user details and image URLs
        for (const funcImg of funcImgs) {
            const user = await User.findById(funcImg.user);

            if (user) {
                // Get the download URL for the image from Firebase Storage
                const imageFilename = funcImg.image;
                const imageFile = bucket.file(imageFilename);
                const imageUrl = await imageFile.getSignedUrl({ action: 'read', expires: '01-01-2030' });

                usersWithImages.push({
                    user: user.toObject(),
                    imageUrl: imageUrl[0],
                });
            }
        }

        res.status(200).json(usersWithImages);
    } catch (error) {
        console.error('Error getting all users with images:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// The rest of your existing code...

module.exports = router;


// The rest of your existing code...

module.exports = router;