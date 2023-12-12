const mongoose = require('mongoose');

const funcImgSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },
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
