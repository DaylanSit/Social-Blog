const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  // collect any validation errors if they exist
  const errors = validationResult(req);

  // if we HAVE errors
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    // store a new property on the error object which holds the array of all the errors
    error.data = errors.array();
    throw error;
  }

  // create new user in the db
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  // hash the password before storing it in the db for security
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      // create a new user
      const user = new User({
        email: email,
        password: hashedPw,
        name: name,
      });

      // save it to the db
      return user.save();
    })
    .then((result) => {
      // if we reach this then block, the save succeeded
      // 'result' is the user object that was saved
      res.status(201).json({ message: "User created", userId: result._id });
    })
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // store the loaded user so that we can use it throughout this
  // entire method
  let loadedUser;

  // check whether user exists
  User.findOne({ email: email })
    .then((user) => {
      // if user does not exist, throw error
      if (!user) {
        const error = new Error("A user with this email could not be found");
        error.statusCode = 401;
        throw error;
      }

      loadedUser = user;

      // validate the given password => will return true or false depending on
      // whether the passwords are the same
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      // user entered the wrong password
      if (!isEqual) {
        const error = new Error("Wrong password");
        error.statusCode = 401;
        throw error;
      }

      // user entered the right password, generate jwt
      // .sign() creates a new signature and places it in a new jwt
      // We can add any JSON data into the token
      // We should obviously not store the raw password in the token because
      // that would be returned to the frontend which is unsafe
      const token = jwt.sign(
        {
          email: loadedUser.email,

          // _id is originally a mongodb object ID, therefore must convert it to a String
          userId: loadedUser._id.toString(),
        },
        // second arg is the 'secret' which is the private key used for signing which
        // determines how the algorithm for verifying a token works
        "thisisaverysecretkeysecret",

        // third arg is some options
        // this token expires in 1h, then the client must login again
        // Security mechanism that is used because the token can be stolen if for example
        // the user does not logout and another person copies that token from the browser storage
        // If the token does not expire, the person can use that stolen token forever
        { expiresIn: "1h" }
      );

      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      // if no user found
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        status: user.status,
      });
    })
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.updateUserStatus = (req, res, next) => {
  const newStatus = req.body.status;
  User.findById(req.userId)
    .then((user) => {
      // if no user found
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      user.status = newStatus;
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ message: "User status updated" });
    })
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      next(err);
    });
};
