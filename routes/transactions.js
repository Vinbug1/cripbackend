const express = require('express');
const router = express.Router();
const { Transaction } = require('../models/tranasaction'); //Transaction = require('../models/transaction');
const { User } = require('../models/user');
const bitcoin = require('bitcoinjs-lib');
const Web3 = require('web3');
require('dotenv').config();

const ethPrivateKey = process.env.ETHEREUM_PRIVATE_KEY;
const ethAddress = process.env.ETHEREUM_ADDRESS;
const bitPrivateKey = process.env.BITCOIN_PRIVATE_KEY;
const bitAddress = process.env.BITCOIN_ADDRESS;

// Bitcoin configuration
const bitcoinNetwork = bitcoin.networks.mainnet;
const bitcoinPrivateKey = bitPrivateKey;
const bitcoinRecipientAddress = bitAddress;

//Ethereum configuration
const ethereumNetwork = 'https://mainnet.infura.io/v3/2eecfa70d4c044a38dc9fdb7e77ddd1e';
const ethereumPrivateKey = ethPrivateKey;
const ethereumRecipientAddress = ethAddress;

// Deposit function to transfer money to the specified coin address and update user balance
router.post('/', async (req, res) => {
    try {
        const { accountType, amount, userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (accountType === 'bitcoin') {
            // Bitcoin deposit logic
            const bitcoinTx = new bitcoin.TransactionBuilder(bitcoinNetwork);
            bitcoinTx.addInput('previous_transaction_id', 0);
            bitcoinTx.addOutput(bitcoinRecipientAddress, amount * 1e8);
            bitcoinTx.sign(0, bitcoin.ECPair.fromWIF(bitcoinPrivateKey));

            const txHex = bitcoinTx.build().toHex();
            const response = await axios.post('https://blockstream.info/testnet/api/tx', { tx: txHex });

            if (response.status === 200) {
                console.log(`Bitcoin transaction sent: ${response.data.txid}`);
            } else {
                throw new Error('Failed to broadcast Bitcoin transaction');
            }
        } else if (accountType === 'ethereum') {
            // Ethereum deposit logic
            const web3 = new Web3(new Web3.providers.HttpProvider(ethereumNetwork));

            const ethereumTx = {
                from: ethAddress,
                to: user.ethereumAddress,
                value: web3.utils.toWei(amount.toString(), 'ether'),
                gas: 21000,
                gasPrice: web3.utils.toWei('30', 'gwei'),
                nonce: await web3.eth.getTransactionCount(ethereumRecipientAddress),
            };

            const signedEthereumTx = await web3.eth.accounts.signTransaction(ethereumTx, ethereumPrivateKey);
            const txReceipt = await web3.eth.sendSignedTransaction(signedEthereumTx.rawTransaction);

            console.log(`Ethereum transaction sent: ${txReceipt.transactionHash}`);
        } else {
            throw new Error('Invalid account type');
        }

        // Update user balance
        user.coins = (user.coins || 0) + parseFloat(amount);
        const updatedUser = await user.save();

        if (!updatedUser) {
            throw new Error('Failed to update user balance');
        }

        console.log(`User balance updated: ${updatedUser.coins}`);

        // Assuming your User model has fields username and accountNumber
        const transaction = new Transaction({
            username: user.username,
            amount,
            accountNumber: user.accountNumber,
            // ... other transaction data
        });

        // Save the transaction object to the database
        const savedTransaction = await transaction.save();
        if (!savedTransaction) {
            throw new Error('Failed to save transaction');
        }
        res.status(200).json({ success: true, message: 'Deposit successful' });
    } catch (error) {
        console.error('Deposit error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get a transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            res.status(404).json({ success: false, message: 'Transaction not found' });
        } else {
            res.status(200).json(transaction);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update a transaction by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!updatedTransaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.status(200).json({ success: true, message: 'Transaction updated successfully', transaction: updatedTransaction });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete a transaction by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findByIdAndRemove(req.params.id);

        if (!deletedTransaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
