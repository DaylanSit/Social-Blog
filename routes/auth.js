const express = require("express");
const validator = require("express-validator");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

const User = require("../models/user");
const authController = require("../controllers/auth");

router.put(
  "/signup",
  [
    // check the request body's 'email' field
    validator
      .body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      // get rid of capital letters
      .normalizeEmail()
      // custom validator to check whether the email already exists
      // return true if validation succeeds or returna promise if the validation
      // uses some async task
      .custom((value, { req }) => {
        // 'email' is the property of the document in the db
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            // if we find a user, return a rejected promise which causes validation to fail
            return Promise.reject("Email address already exists");
          }
          return Promise.resolve();
        });
      }),
    validator.body("password").trim().isLength({ min: 5 }),
    validator
      .body("name")
      .trim()
      // name field should not be empty
      .not()
      .isEmpty(),
  ],
  authController.signup
);

router.post(
  "/login",
  [validator.body("email").normalizeEmail()],
  authController.login
);

router.get("/status", isAuth, authController.getUserStatus);

// edit user status
router.patch(
  "/status",
  isAuth,
  [validator.body("status").trim().not().isEmpty()],
  authController.updateUserStatus
);

module.exports = router;
