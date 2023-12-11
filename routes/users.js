const { User } = require('../models/user');
const Transaction = require('../models/transaction');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require("dotenv").config();

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        // User is an admin
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized - Admins only' });
    }
};


// Route to get all users with their details (protected for admins)
router.get('/all-users', async (req, res) => {
    try {
        const allUsers = await User.find().select('-passwordHash');
        res.status(200).json({ success: true, data: allUsers });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


// Route to get a specific user by ID (protected for admins)
router.get('/get-user/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Function to manually add coins and profit to a user
router.post('/add-coins-profit/:userId', async (req, res) => {
    try {
        // // Check if the request is coming from an admin (you can customize this check based on your authentication logic)
        // const isAdmin = req.headers['admin-auth-token'] === process.env.ADMIN_AUTH_TOKEN;

        // if (!isAdmin) {
        //     return res.status(403).json({ success: false, message: 'Unauthorized access' });
        // }

        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { coinsToAdd, profitToAdd } = req.body;

        // Validate that coinsToAdd and profitToAdd are numbers
        if (isNaN(coinsToAdd) || isNaN(profitToAdd)) {
            return res.status(400).json({ success: false, message: 'Invalid input. Coins and profit must be numbers.' });
        }

        // Add coins and profit to the user
        user.coins += parseInt(coinsToAdd);
        user.profit += parseInt(profitToAdd);

        // Save the updated user data to the database
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Coins and profit added successfully',
            updatedUser: {
                email: user.email,
                username: user.username,
                accountBalance: user.coins || 0,
                profit: user.profit || 0,
            },
        });
    } catch (error) {
        console.error('Error adding coins and profit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Function to manually edit and reduce coins and profit of a user
router.put('/edit-coins-profit/:userId', async (req, res) => {
    try {
        // Check if the request is coming from an admin (you can customize this check based on your authentication logic)
        const isAdmin = req.headers['admin-auth-token'] === process.env.ADMIN_AUTH_TOKEN;

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { coinsToEdit, profitToEdit } = req.body;

        // Validate that coinsToEdit and profitToEdit are numbers
        if (isNaN(coinsToEdit) || isNaN(profitToEdit)) {
            return res.status(400).json({ success: false, message: 'Invalid input. Coins and profit must be numbers.' });
        }

        // Ensure that the admin does not reduce coins or profit below zero
        if (user.coins - coinsToEdit < 0 || user.profit - profitToEdit < 0) {
            return res.status(400).json({ success: false, message: 'Coins or profit cannot be reduced below zero.' });
        }

        // Edit and reduce coins and profit of the user
        user.coins -= parseInt(coinsToEdit);
        user.profit -= parseInt(profitToEdit);

        // Save the updated user data to the database
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Coins and profit edited successfully',
            updatedUser: {
                email: user.email,
                username: user.username,
                accountBalance: user.coins || 0,
                profit: user.profit || 0,
            },
        });
    } catch (error) {
        console.error('Error editing coins and profit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        const secret = process.env.SECRET;

        if (!user) {
            return res.status(400).json({ success: false, message: 'The user not found' });
        }

        if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
            const token = jwt.sign(
                {
                    userId: user._id,
                    isAdmin: user.isAdmin
                },
                secret,
                { expiresIn: '1d' }
            );

            // Update last login time
            user.last_login_time = new Date();

            // Fetch user's transaction history
            const userTransactions = await Transaction.find({ username: user.username });

            // Save the updated user data to the database
            await user.save();

            // Respond with a 200 status code and the user data including transactions
            res.status(200).json({
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                token: token,
                userId: user.id,
                name: user.name,
                phone: user.phone,
                accountNumber: user.accountNumber,
                accountBalance: user.coins || 0,
                profit: user.profit || 0,
                transactions: userTransactions,
            });
        } else {
            res.status(400).json({ success: false, message: 'Password is wrong!' });
        }
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});



router.post('/register', async (req, res) => {
    try {

        // Create a new user
        const {
            fullname,
            username,
            email,
            password,
            secretQuestion,
            secretAnswer,
            accountType,
         } = req.body;
        // Check if password is present
        if (!req.body.password) {
            return res.status(400).json({ success: false, message: 'Password is required.' });
        }
        const passwordHash = bcrypt.hashSync(password, 10);


        // Create a new user
        let user = new User({
            fullname,
            username,
            email,
            passwordHash,
            secretQuestion,
            secretAnswer,
            accountType,
            // Coins and profit will be added automatically with default values
            last_login_time: new Date(),  // Set initial login time
        });

        // Save the user to the database
        user = await user.save();

        if (!user) {
            return res.status(400).json({ success: false, message: 'The user cannot be created!' });
        }

        // Respond with a 200 status code and the user data
        res.status(200).json({
            success: true,
            message: 'Registration successful',
            user: {
                _id: user._id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                coin_type: user.coin_type,
                accountType: user.accountType,
                coins: user.coins,
                profit: user.profit,
                last_login_time: user.last_login_time,
            },
        });
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Route for upgrading user plan
router.post('/upgrade-plan/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the user has enough coins to upgrade
        if (user.coins >= 10) {
            user.coins -= 10;
            user.coin_type = "upgraded";

            // Save the updated user data to the database
            await user.save();

            res.status(200).json({ success: true, message: 'Plan upgraded successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Insufficient coins to upgrade the plan' });
        }
    } catch (error) {
        console.error("Error in upgrading plan:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route for manipulating user profit individually (protected for admins)
router.put('/manipulate-user/:userId',  async (req, res) => {
    try {
        const { coins, profit } = req.body;
        const userId = req.params.userId;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user's coins and profit
        user.coins = coins;
        user.profit = profit;

        // Save the updated user data to the database
        await user.save();

        res.status(200).json({ success: true, message: 'User details manipulated successfully' });
    } catch (error) {
        console.error('Error manipulating user details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Other routes...

module.exports = router;









// const { User } = require('../models/user');
// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// require("dotenv").config();
// const nodemailer = require('nodemailer');


// // Function to update user coins based on login
// async function updateCoinsOnLogin(user) {
//     const current_time = new Date();
//     const time_difference = current_time - user.last_login_time;

//     if (time_difference >= 24 * 3600 * 1000) {
//         if (user.coin_type === "basic") {
//             user.coins += 5;
//         } else if (user.coin_type === "upgraded") {
//             user.coins += 15;
//         }

//         user.last_login_time = current_time;

//         // Save the updated user data to the database
//         await user.save();
//     }
// }

// // Route for user login
// router.post('/login', async (req, res) => {
//     try {
//         const user = await User.findOne({ username: req.body.username });
//         const secret = process.env.SECRET;

//         if (!user) {
//             return res.status(400).send('The user not found');
//         }

//         if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
//             const token = jwt.sign(
//                 {
//                     userId: user._id,
//                     isAdmin: user.isAdmin
//                 },
//                 secret,
//                 { expiresIn: '1d' }
//             );

//             // Update user coins on login
//             await updateCoinsOnLogin(user);

//             res.status(200).send({
//                 email: user.email,
//                 username: user.username,
//                 token: token,
//                 userId: user.id,
//                 name: user.name,
//                 phone: user.phone,
//                 accountNumber: user.accountNumber,
//                 accountBalance: user.coins || 0,
//             });
//         } else {
//             res.status(400).send('Password is wrong!');
//         }
//     } catch (error) {
//         console.error("Error in login:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // Route for user registration
// router.post('/register', async (req, res) => {
//     try {
//         // Check if password is present
//         if (!req.body.password) {
//             return res.status(400).send('Password is required.');
//         }


//         // Create a new user with the generated account number
//         let user = new User({
//             fullname: req.body.fullname,
//             username: req.body.username,
//             email: req.body.email,
//             passwordHash: bcrypt.hashSync(req.body.password, 10),
//             secretQuestion: req.body.secretQuestion,
//             secretAnswer: req.body.secretAnswer,
//             walletAddress: walletAddress,
//             coin_type: req.body.coin_type || "basic",  // Assuming a default value if not provided
//             coins: 1,  // Initial coins on signup
//             last_login_time: new Date(),  // Set initial login time
//         });

//         // Save the user to the database
//         user = await user.save();

//         // Send wallet address to the user's email

//         if (!user) {
//             return res.status(400).send('The user cannot be created!');
//         }

//         // Set a custom response header for successful registration
//         res.header('Registration-Successful', 'true');

//         // Respond with a 200 status code
//         res.status(200).json({ success: true, message: 'Registration successful' });
//     } catch (error) {
//         console.error("Error in registration:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // Route for upgrading user plan
// router.post('/upgrade-plan/:id', async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id);

//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         // Check if the user has enough coins to upgrade
//         if (user.coins >= 10) {
//             user.coins -= 10;
//             user.coin_type = "upgraded";

//             // Save the updated user data to the database
//             await user.save();

//             res.status(200).json({ success: true, message: 'Plan upgraded successfully' });
//         } else {
//             res.status(400).json({ success: false, message: 'Insufficient coins to upgrade the plan' });
//         }
//     } catch (error) {
//         console.error("Error in upgrading plan:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // Other routes...

// module.exports = router;












