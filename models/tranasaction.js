const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  
  accountNumber: {
    type: String,
    required: true,
  },
  accountType:{
    type: String,
    required: true,
  },
  amount:{
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
},
});

transactionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

transactionSchema.set("toJSON", {
  virtuals: true,
});

exports.Transaction = mongoose.model("Transaction", transactionSchema);
exports.transactionSchema = transactionSchema;

