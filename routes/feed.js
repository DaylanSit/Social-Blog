// news feed where we can create new messages, show existing messages
// for all of these routes, none of them should be public
// if no token is attached to the incoming request or the token is invalid, we should block access
// use the middleware function from is-auth.js

const express = require("express");

const validator = require("express-validator");

// express Router allows us to have separate routing files
const router = express.Router();

const feedController = require("../controllers/feed");

const isAuth = require("../middleware/is-auth");

// handle GET at URL /feed/posts
// Request gets handled by feedController.getPosts
// API endpoint for getting ALL posts
router.get("/posts", isAuth, feedController.getPosts);

// handle POST at URL /feed/post
// API endpoint for creating a new post
router.post(
  "/post",
  isAuth,
  [
    // trim() remvoes whitespace
    validator.body("title").trim().isLength({ min: 5 }),
    validator.body("content").trim().isLength({ min: 5 }),
  ],
  feedController.postPost
);

// we will encode the id of the post we want to fetch in the URL
router.get("/post/:postId", isAuth, feedController.getPost);

// editing a post is like replacing the old post with a new one while keeping hte same _id
// since we are replacing a resource, we will use PUT
// We are not able to send PUT requests with normal browser HTML forms
// Through async Javascript requests, we are
// PUT and PATCH requests have a request body
router.put(
  "/post/:postId",
  isAuth,
  [
    // trim() remvoes whitespace
    validator.body("title").trim().isLength({ min: 5 }),
    validator.body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);

// cant send a body with delete requests
router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
