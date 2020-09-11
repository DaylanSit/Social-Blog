const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // with the req.get() method we can get some header value
  // check if the authorization token is set in the header field 'Authorization'
  const authValue = req.get("Authorization");
  if (!authValue) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  const token = req.get("Authorization").split(" ")[1];

  let decodedToken;

  // decode the token
  try {
    // jwt.verify will decode and verify the token
    // second arg must be the same secret that was used for signing the token
    // .verify() can fail if the token cannot be decoded
    decodedToken = jwt.verify(token, "thisisaverysecretkeysecret");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  // if the token is not verified, the decodedToken will be null
  if (!decodedToken) {
    const error = new Error("Not authenticated");

    error.statusCode = 401;
    throw error;
  }

  // we can now access the JSON data that was stored on the token since it is verified
  req.userId = decodedToken.userId;

  next();
};
