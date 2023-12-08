const mongoose = require('mongoose');

const funcImgSchema = new mongoose.Schema({
    // user: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //     required: true,
    // },
    image: {
        type: String,
        required: true,
    },
    path: {
        type: String, // Make sure path is properly defined
        required: true,
    },
});

const FuncImg = mongoose.model('FuncImg', funcImgSchema);

module.exports = FuncImg;
