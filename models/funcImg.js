const mongoose = require('mongoose');

const funcImgSchema = new mongoose.Schema({
    
    image: {
        type: String,
    }
    
});

const FuncImg = mongoose.model('FuncImg', funcImgSchema);

module.exports = FuncImg;
