const supertest = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');  
const connectTestDB = require('./testDb');
const Book = require('../models/Book');
const Author = require('../models/Author');

// arrange NODE_ENV value for using test environment
process.env.NODE_ENV = 'test';
const PORT = process.env.PORT || 3000;

let server;
beforeAll(async () => {
  await connectTestDB();
  server = app.listen(process.env.PORT, () => {
    console.log('Test server started');
  });

});

afterAll(async () => {

  // drop the database 
  await mongoose.connection.dropDatabase();
  // close the connection
  await mongoose.connection.close();

  // shut down the server
  server.close();
  
  // restore the env variable for next run
  process.env.NODE_ENV = 'production';
});

describe("POST /createBook", () => {
  /**
   Response status should be 201
   Content-type header must be application/json
   Book can be found in database
   */
   test("should add a new book", async () => {
    const newBook = {
      "title": "The Hitchhiker's Guide to the Galaxy",
      "authorName": "Douglas Adams",
      "authorCountry": "United Kingdom",
      "authorBirthDate": "1952-03-11",
      "price": 14,
      "isbn": "978-0345391803",
      "language": "English",
      "numberOfPages": 224,
      "publisher": "Del Rey"
    };
  
    const response = await supertest(app)
      .post('/createBook')
      .set('Content-Type', 'application/json') 
      .send(newBook);

    // assertions
    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toContain('json');
    const createdBook = await Book.findOne({ isbn: newBook.isbn });
    expect(createdBook).toBeTruthy();

  });


  // failed test, it must failed with status code '400' and error message 'Book is already in the database!'
  test("try to add a book which is already in the database", async () => {

    //this book has already seed to database in testDb.js 
    const newBook = {  
        "title": "1984",
        "authorName": "George Orwell",
        "authorCountry": "United Kingdom",
        "authorBirthDate": "1903-06-25",
        "price": 13,
        "isbn": "978-0452284246",
        "language": "English",
        "numberOfPages": 328,
        "publisher": "Penguin Books"
    };
  
    const response = await supertest(app)
      .post('/createBook')
      .set('Content-Type', 'application/json') 
      .send(newBook);

    // assertions
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('json');
    expect(response.body.error).toBe('Book is already in the database!');

  });
  
});

// test case for fetching books
describe("GET /fetchBooks", () => {
  /*
  Status code must be 200
  Content-type header must be application/json
  Response should be an array
  
  */

  // Success case of listing books
  test("should list all books", async () => {
    const response = await supertest(app)
      .get('/fetchBooks');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('json');
    expect(response.body).toBeInstanceOf(Array);

  });
});




// test case for deleting book 
describe("DELETE /deleteBook", () => {

  //success case for delete book, valid isbn number should be used otherwise fails.
  test("should delete a book by ISBN", async () => {
    const isbnToDelete = "978-0345391803";

    const response = await supertest(app)
      .delete(`/deleteBook?isbn=${isbnToDelete}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Book deleted successfully.');
    

  });

  //fail case for delete book
  test("should return 404 for not-existent book in db", async () => {
    const isbnToDelete = "1234445";

    const response = await supertest(app)
      .delete(`/deleteBook?isbn=${isbnToDelete}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Book not found!');

  });
});

// test case for update book
describe('PUT /updateBook', () => {

  // success case for update book 
  test('should update an existing book', async () => {
    // create a test book to update if it doesn't exist
    const isbn1984= '978-0452284246';

    // update the book, only title, language, publisher, and price can be updated
    const updatedBook = {
      "title": "Updated Test Book",
      "isbn": isbn1984,
      "price": 5,
      "language": "Updated Test Language",
      "publisher": "Updated Test publisher"
    };
    
    const updateRes = await supertest(app)
      .put('/updateBook')
      .send(updatedBook);

    // assertions
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe('Book updated successfully.');

    // verify the update 
   
    const getRes = await supertest(app).get(`/getBook?isbn=${isbn1984}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.fetchedBook.title).toBe(updatedBook.title);
    expect(getRes.body.fetchedBook.price).toBe(updatedBook.price);
    expect(getRes.body.fetchedBook.language).toBe(updatedBook.language);
    expect(getRes.body.fetchedBook.publisher).toBe(updatedBook.publisher);

  });
  

  // fail case for update book
  test('should return 404 for non-existent book', async () => {

    // not-existent book isbn
    const invalidIsbn = "1234";
    const updateRes = await supertest(app)
      .put('/updateBook')
      .send({ isbn: invalidIsbn, title: 'New Title' });

    // assertions
    expect(updateRes.status).toBe(404);
    expect(updateRes.body.error).toBe('Book not found!');
  });
}); 
