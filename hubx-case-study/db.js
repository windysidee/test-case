const mongoose = require('mongoose');
require('dotenv').config();


const URI = process.env.MAIN_DB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log('Connected to MongoDB (bookdb)');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;