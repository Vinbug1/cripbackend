const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    profit: {
        type: Number,
        default: 0,
    },
    amount:{
        type: Number,
        default: 0,
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
