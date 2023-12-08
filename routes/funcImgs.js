const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const { FuncImg } = require('../models/funcImg');
const User = require('../models/user');

// Initialize Firebase Admin SDK
admin.initializeApp({
    // Your Firebase Admin SDK configuration here...
});

// Reference to Firebase Storage
const storage = admin.storage();
const bucket = storage.bucket();

// Multer configuration for handling image uploads
const storageConfig = multer.memoryStorage();
const upload = multer({ storage: storageConfig });

// Upload an image
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        const { user } = req.body;
        const imageBuffer = req.file.buffer;

        // Generate a unique filename based on the original filename
        const filename = `${Date.now()}_${path.basename(req.file.originalname)}`;
        const file = bucket.file(filename);

        // Create a write stream to upload the image to Firebase Storage
        const fileStream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        fileStream.on('error', (error) => {
            console.error('Error uploading image:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });

        fileStream.on('finish', async () => {
            // Save the image information to the database
            const funcImg = new FuncImg({
                user: user,
                image: filename,
            });

            await funcImg.save();

            res.status(200).json({ message: 'Image uploaded successfully' });
        });

        fileStream.end(imageBuffer);
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Download an image
router.get('/download-image/:id', async (req, res) => {
    try {
        const funcImg = await FuncImg.findById(req.params.id);

        if (!funcImg) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const filename = funcImg.image;
        const file = bucket.file(filename);
        const fileStream = file.createReadStream();

        // Set response headers for image download
        res.setHeader('Content-Type', 'image/*');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        fileStream.on('error', (error) => {
            console.error('Error downloading image:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });

        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
