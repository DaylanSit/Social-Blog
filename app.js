const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const { uuid } = require("uuidv4");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },

  filename: (req, file, cb) => {
    // uuid is a universally unique identifier
    cb(null, uuid());
  },
});

const fileFilter = (req, file, cb) => {
  // check if the file type is valid
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  // single("image") informs multer that we will extract a single file stored in some field named "image" in the incoming request
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// bodyParser.json() is able to parse json data from incoming requests that have bodies with content type of application/json
// with a REST API, we expect all requests to have content-type of JSON
// Allows us to extract variables from req.body.<variable>
// With traditional app, data had format of x-www-form-urlencoded which is the default data type if the data is submitted through
// a form POST request
app.use(bodyParser.json());

// serve the images folder statically
// path.join() is used to construct an absolute path to the images folder
// __dirname is the directory path to this current folder
app.use("/images", express.static(path.join(__dirname, "images")));

// Need to set some special headers on any response that leaves the server to disable the CORS error
// use a general middleware that every request will go through
app.use((req, res, next) => {
  // This header determines what origins are allowed to access our server
  // second parameter is the URLs that should be able to access data from our server
  // '*' means wildcard (any domain)
  res.setHeader("Access-Control-Allow-Origin", "*");

  // For the origins that are allowed to access our server, we then specify
  // what HTTP methods they can use to access our API
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );

  // headers our clients are allowed to set in the header of their requests
  // (there are default headers such as Date that are always allowed)
  // We set the Authorization header so that clients can send requests that hold extra
  // authorization data
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // call next() so that the request can be handled by the other middlewares
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

// register an error handling middleware
// This middleware will be executed whenever an error is thrown or forwarded with next()
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;

  // the message property exists by default on the error object --> it holds the message
  // we pass to the constructor of the error object
  const message = error.message;

  // errors retrieved from the express-validator package
  const data = error.data;

  res.status(status).json({ message: message, data: data });
});

// establish connection to mongodb
mongoose
  .connect(
    "mongodb+srv://daylan:S072097@cluster0.jbvpt.mongodb.net/blog?retryWrites=true&w=majority"
  )
  .then((result) => {
    // use different port than our client
    app.listen(8080);
  })
  .catch((err) => console.log(err));
