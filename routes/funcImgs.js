const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const FuncImg = require('../models/funcImg');
const User = require('../models/user');
const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');


const serviceAccount = require('../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://imagekeep-ac687.appspot.com', // Replace with your actual Firebase Storage bucket URL
});

const bucket = admin.storage().bucket();

const storage = new Storage({
  projectId: 'imagekeep-ac687', // Replace with your Google Cloud project ID
  keyFilename: '../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json', // Replace with your service account key file path
});

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Upload an image
// router.post('/upload-image', upload.single('image'), async (req, res) => {
//   try {
//     const imageBuffer = req.file.buffer;
//     const uniqueFileName = `${Date.now()}-${req.file.originalname}`;

//     const file = bucket.file(uniqueFileName);
//     const fileStream = file.createWriteStream();

//     fileStream.on('error', (err) => {
//       console.error(err);
//       res.status(500).json({ message: 'Error uploading image' });
//     });

//     fileStream.on('finish', async () => {
//      // const imagePath = `gs://${bucket.name}/${uniqueFileName}`;

//       // Assume you have user details, user ID, or any relevant information
//       const userId = 'user_id'; // Replace with the actual user ID
//       const newImage = new FuncImg({
//         user: userId,
//         image: uniqueFileName,
//         path: imagePath,
//       });

//       await newImage.save();
//       res.status(200).json({ message: 'Image uploaded successfully' });
//     });

//     fileStream.end(imageBuffer);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error uploading image' });
//   }
// });

// router.post('/upload-image', upload.single('image'), async (req, res) => {
//   try {
//     // const admin = require('firebase-admin');
//     // const serviceAccount = require('../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json');

//     // admin.initializeApp({
//     //   credential: admin.credential.cert(serviceAccount),
//     //   storageBucket: 'gs://imagekeep-ac687.appspot.com',
//     // });

//     const bucket = admin.storage().bucket();

//     const imageBuffer = req.file.buffer;
//     const uniqueFileName = `${Date.now()}-${req.file.originalname}`;
//     const file = bucket.file(uniqueFileName);
//     const fileStream = file.createWriteStream();

//     fileStream.on('error', (err) => {
//       console.error(err);
//       res.status(500).json({ message: 'Error uploading image' });
//     });

//     fileStream.on('finish', async () => {
//       const imagePath = `gs://${bucket.name}/${uniqueFileName}`;
//       const newImage = new FuncImg({  image: uniqueFileName, path: imagePath });
//       await newImage.save();

//       // Include the imagePath in the response
//       res.status(200).json({ message: 'Image uploaded successfully', imagePath });
//     });

//     fileStream.end(imageBuffer);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error uploading image' });
//   }
// });


// Function to generate a random string of a specified length
function generateRandomString(length) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

router.post('/upload-image', upload.single('image'), async (req, res) => {
    let fileStream; // Declare fileStream outside the try block
    try {
      const bucket = admin.storage().bucket();
  
      const imageBuffer = req.file.buffer;
      const uniqueFileName = `${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(uniqueFileName);
      fileStream = file.createWriteStream();
  
      fileStream.on('error', (err) => {
        console.error(err);
        res.status(500).json({ message: 'Error uploading image' });
      });
  
      fileStream.on('finish', async () => {
        const imagePath = `gs://${bucket.name}/${uniqueFileName}`;
        const newImage = new FuncImg({ image: uniqueFileName, path: imagePath });
        await newImage.save();
  
        // Include the imagePath in the response
        res.status(200).json({ message: 'Image uploaded successfully', imagePath });
      });
  
      fileStream.end(imageBuffer);
    } catch (error) {
      console.error(error);
      if (fileStream) {
        fileStream.end(); // Close the fileStream if an error occurs
      }
      res.status(500).json({ message: 'Error uploading image' });
    }
  });
  

// router.post('/upload-image', upload.single('image'), async (req, res) => {
//   try {
//     // ...

//     const imageBuffer = req.file.buffer;
//     const originalFileName = req.file.originalname;

//     // Generate a random string of length 6
//     const randomString = generateRandomString(6);

//     // Append the random string to the original file name
//     const uniqueFileName = `${Date.now()}-${randomString}-${originalFileName}`;

//     // ...

//     fileStream.on('finish', async () => {
//       const imagePath = `gs://${bucket.name}/${uniqueFileName}`;
//       const newImage = new FuncImg({ image: uniqueFileName, path: imagePath });
//       await newImage.save();

//       // Include the imagePath in the response
//       res.status(200).json({ message: 'Image uploaded successfully', imagePath });
//     });

//     fileStream.end(imageBuffer);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error uploading image' });
//   }
// });

// Get all users with their images
// Get all images with their URLs
// router.get('/getimages', async (req, res) => {
//     try {
//         const funcImgs = await FuncImg.find();

//         const imagesWithUrls = await Promise.all(funcImgs.map(async (funcImg) => {
//             const imageFilename = funcImg.image;
//             const imageFile = bucket.file(imageFilename);
//             const imageUrl = await imageFile.getSignedUrl({ action: 'read', expires: '01-01-2030' });

//             return {
//                 image: funcImg.toObject(),
//                 imageUrl: imageUrl[0],
//             };
//         }));

//         res.status(200).json({ images: imagesWithUrls });
//     } catch (error) {
//         console.error('Error getting all images:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// router.get('/getImages', async (req, res) => {
//     try {
//       const images = await FuncImg.find({}, 'path'); // Retrieve only the 'path' field
//       const imageUrls = await Promise.all(images.map(async (image) => {
//         const gcsPath = image.path.replace(/^gs:\/\/(.*?)\//, ''); // Remove 'gs://' prefix and up to the first '/'
//         console.log('gcsPath:', gcsPath); // Log the gcsPath for debugging
//         const [publicUrl] = await storage.bucket('imagekeep-ac687.appspot.com').file(gcsPath).getSignedUrl({
//           action: 'read',
//          // expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
//         });
//         console.log('publicUrl:', publicUrl); // Log the publicUrl for debugging
//         return publicUrl;
//       }));
      
//       res.json({ images: imageUrls });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error fetching images' });
//     }
//   });

// Get all images with their URLs
router.get('/getimages', async (req, res) => {
    try {
        const funcImgs = await FuncImg.find();

        const imagesWithUrls = await Promise.all(funcImgs.map(async (funcImg) => {
            const imageFilename = funcImg.image;
            
            // Check if funcImg.path is defined before processing
            const gcsPath = funcImg.path ? funcImg.path.replace(/^gs:\/\/(.*?)\//, '') : '';
            
            console.log('gcsPath:', gcsPath); // Log the gcsPath for debugging
            
            if (gcsPath) {
                const imageFile = bucket.file(gcsPath);
                const imageUrl = await imageFile.getSignedUrl({ action: 'read', expires: '01-01-2030' });

                return {
                    image: funcImg.toObject(),
                    imageUrl: imageUrl[0],
                };
            } else {
                console.warn('Image path is empty or undefined:', funcImg);
                return null;
            }
        }));

        // Filter out null values (images with empty or undefined paths)
        const filteredImagesWithUrls = imagesWithUrls.filter(item => item !== null);

        res.status(200).json({ images: filteredImagesWithUrls });
    } catch (error) {
        console.error('Error getting all images:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

  
// router.get('/getimages', async (req, res) => {
//   try {
//     const funcImgs = await FuncImg.find();

//     const usersWithImages = [];

//     for (const funcImg of funcImgs) {
//     const user = await User.findById(funcImg.user);

//       if (user) {
//         const imageFilename = funcImg.image;
//         const imageFile = bucket.file(imageFilename);
//         const imageUrl = await imageFile.getSignedUrl({ action: 'read', expires: '01-01-2030' });

//         usersWithImages.push({
//           user: user.toObject(),
//           imageUrl: imageUrl[0],
//         });
//       }
//     }

//     res.status(200).json(usersWithImages);
//   } catch (error) {
//     console.error('Error getting all users with images:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

module.exports = router;



















// const express = require('express');
// const router = express.Router();
// const admin = require('firebase-admin');
// const multer = require('multer');
// const path = require('path');
// const  FuncImg  = require('../models/funcImg');
// const { Storage } = require('@google-cloud/storage');
 
// const storage = new Storage({
//     projectId: 'imagekeep-ac687  ', // Replace with your Google Cloud project ID
//     keyFilename: '../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json', // Replace with your service account key file path
//   });
  
//   // Set up Multer for handling file uploads
//   const multerStorage = multer.memoryStorage();
//   const upload = multer({ storage: multerStorage });

// // Upload an image
// router.post('/upload-image', upload.single('image'), async (req, res) => {
//     try {
//       // Initialize Firebase Admin inside the route handler
//     const admin = require('firebase-admin');
//     const serviceAccount = require('../imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json');
    
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//       storageBucket: 'gs://imagekeep-ac687.appspot.com', // Replace with your actual Firebase Storage bucket URL
//     });

//     const bucket = admin.storage().bucket(); // Define bucket here

//     // Upload the image to Firebase Storage
//     const imageBuffer = req.file.buffer;
//     const uniqueFileName = `${Date.now()}-${req.file.originalname}`;
//     const file = bucket.file(uniqueFileName);
//     const fileStream = file.createWriteStream();

//     fileStream.on('error', (err) => {
//       console.error(err);
//       res.status(500).json({ message: 'Error uploading image' });
//     });

//     fileStream.on('finish', async () => {
//       // Save the image path to MongoDB
//       const imagePath = `gs://${bucket.name}/${uniqueFileName}`;
//       const newImage = new FuncImg({ path: imagePath });
//       await newImage.save();
//       res.status(200).json({ message: 'FuncImg uploaded successfully' });
//     });

//     fileStream.end(imageBuffer);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error uploading image' });
//   }
// });

// router.get('/getImages', async (req, res) => {
//     try {
//       const images = await FuncImg.find({}, 'path'); // Retrieve only the 'path' field
  
//       // Filter out documents with empty or undefined path
//       const validImages = images.filter(image => image.path);
  
//       const imageUrls = await Promise.all(validImages.map(async (image) => {
//         const gcsPath = image.path.replace(/^gs:\/\/(.*?)\//, '');
//         console.log('gcsPath:', gcsPath); // Log the gcsPath for debugging
//         const [publicUrl] = await storage.bucket('imagekeep-ac687.appspot.com').file(gcsPath).getSignedUrl({
//           action: 'read',
//           // expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
//         });
//         console.log('publicUrl:', publicUrl); // Log the publicUrl for debugging
//         return publicUrl;
//       }));
  
//       res.json({ images: imageUrls });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error fetching images' });
//     }
//   });

// // router.get('/getImages', async (req, res) => {
// //     try {
// //       const images = await FuncImg.find({}, 'path');
// //       const imageUrls = await Promise.all(images.map(async (image) => {
// //         // Check if image.path is defined and not an empty string
// //         if (image.path && image.path.trim() !== '') {
// //           const gcsPath = image.path.replace(/^gs:\/\/(.*?)\//, '');
// //           console.log('gcsPath:', gcsPath);
  
// //           const [publicUrl] = await storage.bucket('imagekeep-ac687.appspot.com').file(gcsPath).getSignedUrl({
// //             action: 'read',
// //             // expires: Date.now() + 24 * 60 * 60 * 1000,
// //           });
// //           console.log('publicUrl:', publicUrl);
// //           return publicUrl;
// //         } else {
// //           console.warn('Image path is empty or undefined:', image);
// //           return null;
// //         }
// //       }));
  
// //       // Filter out null values (images with empty or undefined paths)
// //       const filteredImageUrls = imageUrls.filter(url => url !== null);
  
// //       res.json({ images: filteredImageUrls });
// //     } catch (error) {
// //       console.error(error);
// //       res.status(500).json({ message: 'Error fetching images' });
// //     }
// //   });
  

// // router.get('/getImages', async (req, res) => {
// //   try {
// //     const images = await FuncImg.find({}, 'path'); // Retrieve only the 'path' field
// //     const imageUrls = await Promise.all(images.map(async (image) => {
// //       const gcsPath = image.path ? image.path.replace(/^gs:\/\/(.*?)\//, '') : '';
// //       console.log('gcsPath:', gcsPath); // Log the gcsPath for debugging
// //       const [publicUrl] = await storage.bucket('imagekeep-ac687.appspot.com').file(gcsPath).getSignedUrl({
// //         action: 'read',
// //         // expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
// //       });
// //       console.log('publicUrl:', publicUrl); // Log the publicUrl for debugging
// //       return publicUrl;
// //     }));

// //     res.json({ images: imageUrls });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: 'Error fetching images' });
// //   }
// // });


// // // Download an image
// // router.get('/getImages', async (req, res) => {
// //     try{
// //     const images = await FuncImg.find({}, 'path'); // Retrieve only the 'path' field
// //     const imageUrls = await Promise.all(images.map(async (image) => {
// //       const gcsPath = image.path.replace(/^gs:\/\/(.*?)\//, ''); // Remove 'gs://' prefix and up to the first '/'
// //       console.log('gcsPath:', gcsPath); // Log the gcsPath for debugging
// //       const [publicUrl] = await storage.bucket('imagekeep-ac687.appspot.com').file(gcsPath).getSignedUrl({
// //         action: 'read',
// //        // expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
// //       });
// //       console.log('publicUrl:', publicUrl); // Log the publicUrl for debugging
// //       return publicUrl;
// //     }));
    
// //     res.json({ images: imageUrls });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: 'Error fetching images' });
// //   }
// // });

// // Get all users with their images

// router.get('/get-all-users-with-images', async (req, res) => {
//     try {
//         // Fetch all FuncImg records from the database
//         const funcImgs = await FuncImg.find();

//         // Prepare an array to store user details with images
//         const usersWithImages = [];

//         // Iterate over each FuncImg record to fetch user details and image URLs
//         for (const funcImg of funcImgs) {
//             const user = await User.findById(funcImg.user);

//             if (user) {
//                 // Get the download URL for the image from Firebase Storage
//                 const imageFilename = funcImg.image;
//                 const imageFile = bucket.file(imageFilename);
//                 const imageUrl = await imageFile.getSignedUrl({ action: 'read', expires: '01-01-2030' });

//                 usersWithImages.push({
//                     user: user.toObject(),
//                     imageUrl: imageUrl[0],
//                 });
//             }
//         }

//         res.status(200).json(usersWithImages);
//     } catch (error) {
//         console.error('Error getting all users with images:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });



// // The rest of your existing code...

// module.exports = router;
