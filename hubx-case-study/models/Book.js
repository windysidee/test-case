const mongoose = require("mongoose")
const Author = require("./Author")

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength:1,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Author', 
        required: true,
    },
    
    price:{
        type:Number,
        min:1,
        required:true,
        // max value didn't specified since it's a free market
    },

    isbn: {
        type: String,
        unique: true,
        required: true,
        length: 28,
        
    },
    language: String,
    numberOfPages: {
        type: Number,
        min:1,
        required:true,
    },
    publisher: {
        type: String,
        required:true,
        minLength:1,
    }

},
//{ collection: 'book-documents' } 
)

module.exports = mongoose.model("Book", bookSchema);
