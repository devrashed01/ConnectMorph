// import packages
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/dbConnect");
const morgan = require("morgan");
const http = require("http");
const socketIo = require("socket.io");
require("express-async-errors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

// constants
const PORT = process.env.PORT || 5000;

// initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// JWT authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("No authentication token"));
  }
  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Authentication failed"));
  }
});

require("./socket")(io);

// use packages
app.use(cors());
app.use(express.static(__dirname + "/public"));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads/"));

// init socket io middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // connect to database
  connectDB();
});
