const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    profit: {
        type: Number,
        required: true,
    },
    amount:{
        type: Number,
        required: true,
    },
    account:{
        type: String,
        required: true,
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
