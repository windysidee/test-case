const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Book = require('../models/Book');
const Author = require('../models/Author');
dotenv.config();


const URI = process.env.TEST_DB_URI;

const connectTestDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log('Connected to test database');



    // first seed the author 
    let author = await Author.create({
      "authorName": "George Orwell",
      "authorCountry": "United Kingdom",
      "authorBirthDate": "1903-06-25",
    });
    //seeding George Orwell's 1984 for testing

    const seedBook = {
      "title": "1984",
      "author": author._id,
      "price": 13,
      "isbn": "978-0452284246",
      "language": "English",
      "numberOfPages": 328,
      "publisher": "Penguin Books"
    };

    await Book.create(seedBook);
  } catch (error) {
    console.error('Failed to connect to test database:', error);
  }
  
};

module.exports = connectTestDB;
