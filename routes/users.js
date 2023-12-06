const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const nodemailer = require('nodemailer');


router.get(`/`, async (req, res) =>{
    const userList = await User.find().select('-passwordHash');

    if(!userList) {
        res.status(500).json({success: false})
    } 
    res.send(userList);
})

router.get('/:id', async(req,res)=>{
    const user = await User.findById(req.params.id).select('-passwordHash');

    if(!user) {
        res.status(500).json({message: 'The user with the given ID was not found.'})
    } 
    res.status(200).send(user);
})

router.put('/:id',async (req, res)=> {

    const userExist = await User.findById(req.params.id);
    let newPassword
    if(req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
        newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            accountNumber: req.body.accountNumber,
        },
        { new: true}
    )

    if(!user)
    return res.status(400).send('the user cannot be created!')

    res.send(user);
})

router.post('/login', async (req,res) => {
    const user = await User.findOne({email: req.body.email})
    const secret = process.env.SECRET;
    if(!user) {
        return res.status(400).send('The user not found');
    }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user._id,
                isAdmin: user.isAdmin
            },
            secret,
            {expiresIn : '1d'}
        )
       
        res.status(200).send({
            email: user.email,
          username: user.username, 
           token: token,
           userId: user.id,
          name: user.name,
          phone: user.phone,
          accountNumber: user.accountNumber,
          coins: user.coins || 0,
          }) 
    } else {
       res.status(400).send('password is wrong!');
    }    
})



// Function to generate a random account number
function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString(); // Example: 10-digit account number
}
// Update the sendAccountToEmail function to handle errors gracefully
function sendAccountToEmail(email, accountNumber, res) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com', // Outlook SMTP server
        port: 587, 
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your new account number",
        text: `Your account number is: ${accountNumber}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            if (error.code === 'ETIMEDOUT') {
                // Handle timeout error
                return res.status(500).send('Email sending timed out. Please try again later.');
            }
            // Handle other errors...
            // Make sure not to send multiple responses here
        } else {
            console.log("Email sent:", info.response);
            // You can send a success response if needed
            // res.status(200).send('Email sent successfully.');
        }
    });
}

// Update the registration endpoint to properly handle responses
router.post('/register', async (req, res) => {
    try {
        // Check if password is present
        if (!req.body.password) {
            return res.status(400).send('Password is required.');
        }

        // Generate an account number
        const accountNumber = generateAccountNumber();

        // Create a new user with the generated account number
        let user = new User({
            fullname: req.body.fullname,
            username: req.body.username,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.password, 10),
            secretQuestion: req.body.secretQuestion,
            secretAnswer: req.body.secretAnswer,
            accountNumber: accountNumber,
        });

        // Save the user to the database
        user = await user.save();

        if (!user) {
            return res.status(400).send('The user cannot be created!');
        }

        // Log for debugging
        console.log("Email:", req.body.email);
        console.log("Account Number:", accountNumber);

        // Set a custom response header for successful registration
        res.header('Registration-Successful', 'true');

        // Respond with a 200 status code
        res.status(200).json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.error("Error in registration:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// router.post('/register', async (req, res) => {
//     try {
//         // Generate an account number
//         const accountNumber = generateAccountNumber();

//         // Create a new user with the generated account number
//         let user = new User({
//             fullname: req.body.fullname,
//             username: req.body.username,
//             email: req.body.email,
//             passwordHash: bcrypt.hashSync(req.body.password, 10),
//             secretQuestion: req.body.secretQuestion,
//             secretAnswer: req.body.secretAnswer,
//             accountNumber: accountNumber,
//         });

//         // Save the user to the database
//         user = await user.save();

//         if (!user) {
//             return res.status(400).send('The user cannot be created!');
//         }
//         sendAccountToEmail(email, accountNumber); // You need to implement this function
//         res.send(user);
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });
// router.post('/register', async (req, res) => {
//     try {
//         // Check if password is present
//         if (!req.body.password) {
//             return res.status(400).send('Password is required.');
//         }

//         // Generate an account number
//         const accountNumber = generateAccountNumber();

//         // Create a new user with the generated account number
//         let user = new User({
//             fullname: req.body.fullname,
//             username: req.body.username,
//             email: req.body.email,
//             passwordHash: bcrypt.hashSync(req.body.password, 10),
//             secretQuestion: req.body.secretQuestion,
//             secretAnswer: req.body.secretAnswer,
//             accountNumber: accountNumber,
//         });

//         // Save the user to the database
//         user = await user.save();

//         if (!user) {
//             return res.status(400).send('The user cannot be created!');
//         }

//         // Log for debugging
//         console.log("Email:", req.body.email);
//         console.log("Account Number:", accountNumber);

//         // Pass the email to the function
//         sendAccountToEmail(req.body.email, accountNumber);

//         res.send(user);
//     } catch (error) {
//         console.error("Error in registration:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });



// function sendAccountToEmail(email, accountNumber) {
//     // const transporter = nodemailer.createTransport({
//     //     //host: "smtp-mail.outlook.com", // Outlook SMTP server
//     //     //port: 587, // Port for sending emails
//     //     host: 'smtp.mail.yahoo.com',
//     //     port: 465, // Port for sending emails
//     //   secure: false,
//     //   auth: {
//     //     user: process.env.EMAIL_USER,
//     //     pass: process.env.EMAIL_PASSWORD,
//     //   },
//     // });
//     const transporter = nodemailer.createTransport({
//         host: 'smtp.mail.yahoo.com',
//         port: 465,
//         secure: false,
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASSWORD,
//         },
//     });
    
  
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your new account number",
//       text: `Your account number is: ${accountNumber}`,
//     };
  
//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.error("Error sending email:", error);
//             if (error.code === 'ETIMEDOUT') {
//                 return res.status(500).send('Email sending timed out. Please try again later.');
//             }
//             // Handle other errors...
//         } else {
//             console.log("Email sent:", info.response);
//             res.status(200).send('Email sent successfully.');
//         }
//     });
    
//   }

// router.post('/register', async (req, res) => {
//     try {
//         // Check if password is present
//         if (!req.body.password) {
//             return res.status(400).send('Password is required.');
//         }

//         // Generate an account number
//         const accountNumber = generateAccountNumber();

//         // Create a new user with the generated account number
//         let user = new User({
//             fullname: req.body.fullname,
//             username: req.body.username,
//             email: req.body.email,
//             passwordHash: bcrypt.hashSync(req.body.password, 10),
//             secretQuestion: req.body.secretQuestion,
//             secretAnswer: req.body.secretAnswer,
//             accountNumber: accountNumber,
//         });

//         // Save the user to the database
//         user = await user.save();

//         if (!user) {
//             return res.status(400).send('The user cannot be created!');
//         }

//         // Log for debugging
//         console.log("Email:", req.body.email);
//         console.log("Account Number:", accountNumber);

//         // Pass the email to the function
//         sendAccountToEmail(req.body.email, accountNumber, res); // Pass res to the function

//         res.send(user);
//     } catch (error) {
//         console.error("Error in registration:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // Update sendAccountToEmail function to accept res parameter
// function sendAccountToEmail(email, accountNumber, res) {
//     const transporter = nodemailer.createTransport({
//         host: 'smtp.mail.yahoo.com',
//         port: 465,
//         secure: false,
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASSWORD,
//         },
//     });

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: "Your new account number",
//         text: `Your account number is: ${accountNumber}`,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.error("Error sending email:", error);
//             if (error.code === 'ETIMEDOUT') {
//                 return res.status(500).send('Email sending timed out. Please try again later.');
//             }
//             // Handle other errors...
//         } else {
//             console.log("Email sent:", info.response);
//             // res.status(200).send('Email sent successfully.'); // You can uncomment this line if needed
//         }
//     });
// }



router.delete('/:id', (req, res)=>{
    User.findByIdAndRemove(req.params.id).then(user =>{
        if(user) {
            return res.status(200).json({success: true, message: 'the user is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "user not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

router.get(`/get/count`, async (req, res) =>{
    const userCount = await User.countDocuments((count) => count)

    if(!userCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        userCount: userCount
    });
})


module.exports =router;