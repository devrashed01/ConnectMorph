const mongoose = require("mongoose");
require("dotenv").config();

// constants
const MONGO_URI = process.env.MONGO_URI;

// connect to database
const connectDB = () =>
  mongoose
    .connect(MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    .then(() => {
      console.log("Connected to database");
    })
    .catch((err) => {
      console.log("Error connecting to database");
      console.log(err);
    });

module.exports = connectDB;
