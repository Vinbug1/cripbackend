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
            phone: req.body.phone,
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
          user: user.email ,
           token: token,
           userId: user.id,
          name: user.name,
          phone: user.phone,
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

router.post('/register', async (req, res) => {
    try {
        // Generate an account number
        const accountNumber = generateAccountNumber();

        // Create a new user with the generated account number
        let user = new User({
            name: req.body.name,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.password, 10),
            phone: req.body.phone,
            accountNumber: accountNumber,
        });

        // Save the user to the database
        user = await user.save();

        if (!user) {
            return res.status(400).send('The user cannot be created!');
        }
        sendAccountToEmail(email, accountNumber); // You need to implement this function
        res.send(user);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

function sendAccountToEmail(email, accountNumber) {
    const transporter = nodemailer.createTransport({
        //host: "smtp-mail.outlook.com", // Outlook SMTP server
        //port: 587, // Port for sending emails
        host: 'smtp.mail.yahoo.com',
        port: 465, // Port for sending emails
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
      } else {
        console.log("Email sent:", info.response);
      }
    });
  }


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