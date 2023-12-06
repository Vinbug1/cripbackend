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

        await handleDeposit(accountType, user, amount);

        // Update user balance
        user.coins = (user.coins || 0) + parseFloat(amount);
        const updatedUser = await user.save();

        if (!updatedUser) {
            throw new Error('Failed to update user balance');
        }

        console.log(`User balance updated: ${updatedUser.coins}`);

        // Save transaction details
        const transaction = new Transaction({
            username: user.username,
            amount,
            accountNumber: user.accountNumber,
            // ... other transaction data
        });

        const savedTransaction = await transaction.save();

        if (!savedTransaction) {
            throw new Error('Failed to save transaction');
        }

        res.status(200).json({ success: true, message: 'Deposit successful', transactionId: savedTransaction._id });
    } catch (error) {
        console.error('Deposit error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

async function handleDeposit(accountType, user, amount) {
    try {
        if (accountType === 'bitcoin') {
            await handleBitcoinDeposit(user, amount);
        } else if (accountType === 'ethereum') {
            await handleEthereumDeposit(user, amount);
        } else {
            throw new Error('Invalid account type');
        }
    } catch (error) {
        console.error('Deposit handler error:', error.message);
        throw error; // Re-throw the error to be caught in the main catch block
    }
}


// async function handleBitcoinDeposit(user, amount) {
//     try {
//         // Bitcoin deposit logic
//         const bitcoinTx = new bitcoin.TransactionBuilder(bitcoinNetwork);
//         bitcoinTx.addInput('previous_transaction_id', 0);
//         bitcoinTx.addOutput(bitcoinRecipientAddress, amount * 1e8);
//         bitcoinTx.sign(0, bitcoin.ECPair.fromWIF(bitcoinPrivateKey));

//         const txHex = bitcoinTx.build().toHex();
//         const response = await axios.post('https://blockstream.info/testnet/api/tx', { tx: txHex });

//         if (response.status !== 200) {
//             throw new Error('Failed to broadcast Bitcoin transaction');
//         }

//         console.log(`Bitcoin transaction sent: ${response.data.txid}`);
//     } catch (error) {
//         console.error('Bitcoin deposit error:', error.message);
//         throw error; // Re-throw the error to be caught in the main catch block
//     }
// }

//const bitcoin = require('bitcoinjs-lib');

// async function handleBitcoinDeposit(user, amount) {
//     try {
//         // Bitcoin deposit logic
//         const keyPair = bitcoin.ECPair.fromWIF(bitcoinPrivateKey, bitcoinNetwork);
//         const txb = new bitcoin.TransactionBuilder(bitcoinNetwork);

//         // Replace 'previous_transaction_id' and 0 with actual input details
//         txb.addInput('previous_transaction_id', 0);

//         // Replace 'bitcoinRecipientAddress' with the actual recipient address
//         txb.addOutput(bitcoinRecipientAddress, amount * 1e8);

//         // Sign the transaction
//         txb.sign(0, keyPair);

//         const txHex = txb.build().toHex();

//         // Broadcast the transaction to the network
//         const response = await axios.post('https://blockstream.info/testnet/api/tx', { tx: txHex });

//         if (response.status === 200) {
//             console.log(`Bitcoin transaction sent: ${response.data.txid}`);
//         } else {
//             throw new Error('Failed to broadcast Bitcoin transaction');
//         }
//     } catch (error) {
//         console.error('Bitcoin deposit error:', error.message);
//         throw error; // Re-throw the error to be caught in the main catch block
//     }
// }


// async function handleBitcoinDeposit(user, amount) {
//     try {
//         const bitcoinPrivateKey = '73e758be-afc5-494a-9348-5f8c108786b9';  // Replace with your actual private key
//         const bitcoinNetwork = bitcoin.networks.testnet;  // Adjust the network if needed

//         if (!bitcoinPrivateKey) {
//             throw new Error('Bitcoin private key is not defined');
//         }

//         const keyPair = bitcoin.ECPair.fromWIF(bitcoinPrivateKey, bitcoinNetwork);
//         const txb = new bitcoin.TransactionBuilder(bitcoinNetwork);

//         // Replace 'previous_transaction_id' and 0 with actual input details
//         txb.addInput('previous_transaction_id', 0);

//         // Replace 'bitcoinRecipientAddress' with the actual recipient address
//         txb.addOutput('bc1qs58klzl8agtadcy62jgvnqwxgq6jz94sjqgzkf', amount * 1e8);

//         // Sign the transaction
//         txb.sign(0, keyPair);

//         const txHex = txb.build().toHex();

//         // Broadcast the transaction to the network
//         const response = await axios.post('https://blockstream.info/testnet/api/tx', { tx: txHex });

//         if (response.status === 200) {
//             console.log(`Bitcoin transaction sent: ${response.data.txid}`);
//         } else {
//             throw new Error('Failed to broadcast Bitcoin transaction');
//         }
//     } catch (error) {
//         console.error('Bitcoin deposit error:', error.message);
//         throw error; // Re-throw the error to be caught in the main catch block
//     }
// }

router.post('/deposit', async (req, res) => {
    try {
        const { bitcoinPrivateKey, depositAmount } = req.body;

        // Perform user authentication, validation, and other checks

        // Your Bitcoin network (mainnet or testnet)
        const bitcoinNetwork = bitcoin.networks.testnet;  // Adjust as needed

        // Validate input data
        if (!bitcoinPrivateKey || !depositAmount) {
            return res.status(400).json({ success: false, error: 'Invalid input data' });
        }

        // Create a Bitcoin transaction for the deposit
        const result = await createBitcoinDepositTransaction(bitcoinPrivateKey, depositAmount, bitcoinNetwork);

        // Update user's balance or transaction history in the database

        // Send a response back to the frontend
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('Bitcoin Deposit Error:', error.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Function to create a Bitcoin deposit transaction
async function createBitcoinDepositTransaction(privateKey, depositAmount, network) {
    try {
        const keyPair = bitcoin.ECPair.fromWIF(privateKey, network);
        const txb = new bitcoin.TransactionBuilder(network);

        // Replace 'recipient_address' with the actual Bitcoin address where you want to receive the deposit
        const recipientAddress = 'bc1qs58klzl8agtadcy62jgvnqwxgq6jz94sjqgzkf';
        txb.addOutput(recipientAddress, depositAmount * 1e8);

        // Sign the transaction
        txb.sign(0, keyPair);

        const txHex = txb.build().toHex();

        // Broadcast the transaction to the Bitcoin network
        const response = await axios.post('https://blockstream.info/testnet/api/tx', { tx: txHex });

        if (response.status === 200) {
            return { transactionId: response.data.txid };
        } else {
            throw new Error('Failed to broadcast Bitcoin deposit transaction');
        }
    } catch (error) {
        console.error('Bitcoin deposit transaction creation error:', error.message);
        throw error;
    }
}




async function handleEthereumDeposit(user, amount) {
    try {
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
    } catch (error) {
        console.error('Ethereum deposit error:', error.message);
        throw error; // Re-throw the error to be caught in the main catch block
    }
}



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
