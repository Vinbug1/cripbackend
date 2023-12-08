const express = require('express');
const router = express.Router();
const  Transaction  = require('../models/tranasaction');
const  {User} = require('../models/user');


// Create a new transaction
// Create a new transaction
router.post('/trans', async (req, res) => {
    try {
        const { user, coin, profit } = req.body;

        // Fetch the user by ID
        const existingUser = await User.findById(user);

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user's coin and profit
        existingUser.coin += coin;
        existingUser.profit += profit;

        // Save the updated user
        const updatedUser = await existingUser.save();

        // Create a new transaction
        const newTransaction = new Transaction({ user, profit, coin });
        const savedTransaction = await newTransaction.save();

        res.status(200).json({ user: updatedUser, transaction: savedTransaction });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Get all transactions
router.get('/address', (req, res) => {
    try {
        const walletAddresses = getWalletAddresses();
        res.status(200).json(walletAddresses);
    } catch (error) {
        console.error('Error getting wallet addresses:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Get a specific transaction by ID
router.get('/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.status(200).json(transaction);
    } catch (error) {
        console.error('Error fetching transaction by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Get all transactions with user details
router.get('/all', async (req, res) => {
    try {
        // Find all transactions and populate the 'user' field with user details
        const transactions = await Transaction.find().populate('user');

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ error: 'No transactions found' });
        }

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching all transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get all transactions for a specific user with specific user details
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find all transactions for the specified user ID and populate specific fields from the 'user' model
        const transactions = await Transaction.find({ user: userId }).populate({
            path: 'user',
            select: 'fullname email date', // Include the specific fields you want
        });

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ error: 'Transactions not found for the user' });
        }

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions for user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Withdrawal endpoint
router.post('/withdrawal', async (req, res) => {
    try {
        const { userId, amount } = req.body;

        // Fetch the user by ID
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user has sufficient funds for withdrawal
        if (existingUser.coin < amount) {
            return res.status(400).json({ error: 'Insufficient funds for withdrawal' });
        }

        // Create a new withdrawal transaction
        const withdrawalTransaction = new Transaction({
            user: userId,
            profit: -amount, // Assuming a negative amount represents a withdrawal
            coin: 0, // Set to 0 for withdrawals, adjust accordingly based on your logic
        });

        // Save the withdrawal transaction
        const savedWithdrawalTransaction = await withdrawalTransaction.save();

        // Update the user's coin balance
        existingUser.coin -= amount;
        const updatedUser = await existingUser.save();

        // Respond with a success message and information about the withdrawal
        res.status(200).json({
            message: 'Withdrawal request successful',
            details: 'Your withdrawal will be processed within 3 working days. If you have any questions, please contact the admin at 12345678.',
            user: updatedUser,
            transaction: savedWithdrawalTransaction,
        });
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




// Update a transaction by ID
router.put('/transactions/:id', async (req, res) => {
    try {
        const { user, coin, profit } = req.body;

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { user, coin, profit },
            { new: true }
        );

        if (!updatedTransaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.status(200).json(updatedTransaction);
    } catch (error) {
        console.error('Error updating transaction by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a transaction by ID
router.delete('/transactions/:id', async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);

        if (!deletedTransaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction by ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function getWalletAddresses() {
    const bitcoinAddress = 'bc1qs58klzl8agtadcy62jgvnqwxgq6jz94sjqgzkf';
    const ethereumAddress = '0xd98e9725dD026a5a4bcb337854D18917bCBD1C03';

    return {
        bitcoinAddress,
        ethereumAddress,
    };
}

// Get all transactions updated recently
router.get('/recent-transactions', async (req, res) => {
    try {
        // Fetch transactions updated within a specific time range (e.g., last 24 hours)
        const currentTime = new Date();
        const twentyFourHoursAgo = new Date(currentTime - 24 * 3600 * 1000);

        const recentTransactions = await Transaction.find({
            updatedAt: { $gte: twentyFourHoursAgo },
        });

        res.status(200).json(recentTransactions);
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




module.exports = router;

