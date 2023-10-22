// import packages
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/dbConnect");
const morgan = require("morgan");
require("express-async-errors");
require("dotenv").config();

// constants
const PORT = process.env.PORT || 5000;

// initialize app
const app = express();

// use packages
app.use(cors());
app.use(express.static(__dirname + "/public"));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads/"));

// routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.use("/api", require("./routes/api"));

// error handling
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next();
});

app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ error: error.message });
});

// start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // connect to database
  connectDB();
});
