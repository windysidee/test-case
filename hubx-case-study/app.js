const express = require('express');
const Book = require('./models/Book');
const Author = require('./models/Author');
const connectDB = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());


// port number should be specified in .env file otherwise 3000 is default value.
const PORT = process.env.PORT || 3000;

// there are two databases, bookdb is main and testdb is test database.
// by arranging NODE_ENV in .env my api switch between databases.
// NODE_ENV switches test automatically when project run by 'npm test'



// starts server and connects test db or main db according to env. var
const startServer = async () => {
  if (process.env.NODE_ENV === 'test') {
    // I have already made the db connection and server initilization
  } else {
    try{
      await connectDB();
      console.log('Connected to the main database.');
    }catch(error){
      res.status(500).json({ error: 'Unexpected error connected to main database!'});


    }
    try{
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
    }catch(error){
      res.status(500).json({ error: 'Unexpected error running server!'});
  
    }
    
  }
  
  
};

startServer();




// creates book with specified writer.
// if writer is already in the database doesn't create writer again.
// if book is already in the database throws an error.
// if any type mismatched or missing throws an error.
app.post('/createBook', async (req, res) => {
  try {
    const { title, authorName, authorCountry, authorBirthDate, price, isbn, language, numberOfPages, publisher } = req.body;


    // type validations
    if (!title || typeof title != 'string' || title.length === 0) {
      return res.status(400).json({ error: "Title must be provided and must be string!" });
    }

    if (!authorName || typeof authorName != 'string' || authorName.length === 0) {
      return res.status(400).json({ error: "Author name is required and must be string!" });
    }

    if (authorCountry && (authorCountry.length < 4 || authorCountry.length > 56)) {
      return res.status(400).json({ error: "Author country name should be between 4 and 56 characters and must be string!" });
    }

    if (!authorBirthDate || isNaN(new Date(authorBirthDate).getTime())) {
      return res.status(400).json({ error: "Author birth date is required and must be 'YYYY-MM-DD' format !" });
    }

    // check if there's already a book has same ISBN
    let isbnBook = await Book.findOne({ isbn: isbn });
    if (isbnBook) {
      return res.status(400).json({ error: "Book is already in the database!" });
    }


    // check if author has been created before
    // if not, create author
    let author = await Author.findOne({ authorName: authorName });
    if (!author) {
      try {
        author = await Author.create({
          authorName: authorName,
          authorCountry: authorCountry,
          authorBirthDate: new Date(authorBirthDate),
        });
      } catch (error) {
        console.error('Error creating author:', error);
        return res.status(500).json({ error: 'Failed to create author!' });
      }
    }

    // other validations
    if (typeof price != 'number' || price <= 0) {
      return res.status(400).json({ error: "Price must be greater than 0 and must be integer!" });
    }

    if (isbn.length > 26) {
      return res.status(400).json({ error: "Invalid ISBN number!" });
    }

    if (!isbn || typeof isbn != 'string') {
      return res.status(400).json({ error: "Unique ISBN number is required and must be string!" });
    }

    if (!numberOfPages || typeof numberOfPages != 'number' || numberOfPages <= 0) {
      return res.status(400).json({ error: "Number of pages must be greater than 0 and integer!" });
    }

    if (!publisher || typeof publisher != 'string' || publisher.length === 0) {
      return res.status(400).json({ error: "Publisher name must be string and not empty!" });
    }

    // after validation of all fields are done create the book
    const book = await Book.create({
      title,
      author: author._id,
      price,
      isbn,
      language,
      numberOfPages,
      publisher,
    });

    // return status 201
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error creating book!' });
  }
});

// fetch all books
app.get('/fetchBooks', async (req, res) => {
  try {
    const books = await Book.find().populate('author', 'authorName');
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error occured while fetching books!' });
  }
});

// delete book by unique isbn; also deletes writer if deleted book will be last book of the writer
app.delete('/deleteBook', async (req, res) => {
  const { isbn } = req.query;
  if (!isbn || typeof isbn !== 'string') {
    return res.status(400).json({ error: "ISBN is required and must be a string!" });
  }

  try {
    // delete the book by ISBN
    const deletedBook = await Book.findOneAndDelete({ isbn: isbn });
    if (!deletedBook) {
      return res.status(404).json({ error: "Book not found!" });
    }

    // check if there are any remaining books by the same author
    const remainingBooks = await Book.find({ author: deletedBook.author });
    if (!remainingBooks.length) {
      // if no remaining books, delete the author
      await Author.deleteOne({ _id: deletedBook.author });
    }

    res.status(200).json({ message: 'Book deleted successfully.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Unexcepted error occured while deleting the book!' });
  }
});


// update book route
app.put('/updateBook', async (req, res) => {

  // specify which book will be updated by ISBN  from request body
  // title,language,publisher 
  const { isbn, title, price, language, publisher } = req.body;

  if (!isbn || typeof isbn != 'string') {
    return res.status(400).json({ error: "ISBN is required and must be string!" });
  }

  try {
    const book = await Book.findOne({ isbn: isbn });
    if (!book) {
      return res.status(404).json({ error: "Book not found!" });
    }

    if (!title || typeof title != 'string' || title.length === 0) {
      return res.status(400).json({ error: "Title must be string and longer than 0 characters." });
    }

    if (!price || typeof price != 'number' || price <= 0) {
      return res.status(400).json({ error: "Price must be integer and greater than 0." });
    }

    if (!publisher || typeof publisher != 'string' || publisher.length === 0) {
      return res.status(400).json({ error: "Publisher name must be string and must not be empty." });
    }

    await Book.updateOne(
      { isbn: isbn },
      { $set: { title, price, language, publisher } }
    );
    res.status(200).json({ message: 'Book updated successfully.' });

  } catch (error) {
    res.status(500).json({ error: "Unexcepted error occured while updating book!" });
  }
});


// helpful route for receiving book with isbn 
// used in test case of 'updateBook'
app.get('/getBook', async (req, res) => {
  const { isbn } = req.query;
  if (!isbn || typeof isbn !== 'string') {
    return res.status(400).json({ error: "ISBN is required and must be a string!" });
  }

  try {
    let fetchedBook = await Book.findOne({ isbn: isbn });
    if (!fetchedBook) {
      return res.status(404).json({ error: 'Book not found!' }); 
    }
    
    res.status(200).json({ fetchedBook });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error occurred retrieving the book!' });
  }
});



module.exports = app;  