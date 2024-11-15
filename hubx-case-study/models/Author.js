const mongoose = require("mongoose")

const authorSchema = new mongoose.Schema({
    authorName: {
        type: String,
        minLength: 1,
        required: true

    },
    authorCountry: {
        type: String,

        // Four-letter countries have the shortest names. All the states recognized by the United Nations have four or more letters.
        // Source: https://www.worldatlas.com/articles/which-country-has-the-shortest-name.html

        //The longest English country name belongs to the United Kingdom, or The United Kingdom of Great Britain and Northern Ireland, with 56 characters.
        // Source: https://homework.study.com/explanation/what-is-the-longest-country-name-in-the-world.html
        minLength:4,
        maxLength:56
    },
    authorBirthDate: {
        type: Date,
        required: true,
        //Youngest author is 4 years old .... according the Guinness World Records
        validate: {
            validator: (value) => {
                const today = new Date();
                const minimumAge = 4;
                const minimumBirthDate = new Date(today.getFullYear() - minimumAge, today.getMonth(), today.getDate());
                return value <= minimumBirthDate;
              },
            message: 'Invalid birth date!',
        },

    },
    
},
//{ collection: 'author-documents' } 

);

module.exports = mongoose.model("Author", authorSchema);