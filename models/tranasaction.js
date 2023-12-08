const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    profit: {
        type: Number,
        required: true,
    },
    coin:{
        type: Number,
        required: true,
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
