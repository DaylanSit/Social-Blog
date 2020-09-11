// format of these function variables are http method and then the object that this action has to do with

const fs = require("fs");
const path = require("path");
const validator = require("express-validator");

const User = require("../models/user");
const Post = require("../models/post");
const { countReset } = require("console");

exports.getPosts = (req, res, next) => {
  // get the current page we want to load from the query parameter of the request
  // If the query parameter is undefined, we are on page 1
  const currentPage = req.query.page || 1;
  const perPage = 5;

  // number of posts in the database
  let totalItems;

  // countDoucments counts how many posts there are (will not retrieve them)
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;

      // .find() by itself finds and retrieves ALL posts from the Post model
      return (
        Post.find()
          .populate("creator")
          // skip() skips a certain number of documents before retrieving them from the db
          .skip((currentPage - 1) * perPage)
          // limit() limits the number of items we retrieve from the db after we have skipped
          .limit(perPage)
      );
    })
    .then((posts) => {
      res
        .status(200)
        // return a JSON response
        // .json() is a method provided by Express that allows us
        // to return a response with JSON data with the right headers being set and so on (such as making the Content-Type: application/json)
        // Can pass a normal JS object to this function and it will be converted ot JSON format
        // and sent back as a response to the client who sent the request
        // Set status code when we send the response, 200 is default for "success"
        // Status code is important so that in the client we have an easy way of handling it
        // Client has to render the user interface based on our response and therefore, success/error status codes
        // are especially important to pass back to the client so client can easily look at the code and determine
        // what it should do (normally render the page or render an error page)
        // res.status(200).json({
        .json({
          message: "fetched posts successfully",
          posts: posts,
          // frontend has logic that takes the total number of posts into account so we know when to show the "next" and "previous" buttons
          totalItems: totalItems,
        });
    })
    // this catch block will be run if an error is thrown from either .countDocuments() or Post.find().skip().limit()
    // or in any of the above then() blocks
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      // "throw err" will not let us go to the next error handling middleware since we
      // are currently in asynchronous code => we are in a .catch block
      // Instead we must call next() with the error object passed in for it to reach the next
      // error handling middleware
      next(err);
    });

  // return a JSON response
  // .json() is a method provided by Express that allows us
  // to return a response with JSON data with the right headers being set and so on (such as making the Content-Type: application/json)
  // Can pass a normal JS object to this function and it will be converted ot JSON format
  // and sent back as a response to the client who sent the request
  // Set status code when we send the response, 200 is default for "success"
  // Status code is important so that in the client we have an easy way of handling it
  // Client has to render the user interface based on our response and therefore, success/error status codes
  // are especially important to pass back to the client so client can easily look at the code and determine
  // what it should do (normally render the page or render an error page)
  // res.status(200).json({
  //   posts: [
  //     {
  //       // we will be looking for these specific variables in the frontend code
  //       // we use _id because we are using mongodb which autmatically adds ids that are called _id
  //       _id: "1",
  //       title: "First Post",
  //       content: "This is the first post",
  //       imageUrl: "images/cat.jpeg",
  //       creator: {
  //         name: "Daylan",
  //       },
  //       createdAt: new Date(),
  //     },
  //   ],
  // });
};

exports.postPost = (req, res, next) => {
  // extracts any eorrs the validation package gathered
  const errors = validator.validationResult(req);

  // we have errors
  if (!errors.isEmpty()) {
    // create new error object
    const error = new Error("Validation failed, entered data is incorrect");

    // add our customer property called "statusCode"
    // 422 is a validation error
    error.statusCode = 422;

    // throwing the error will automatically exit the function execution and instead
    // try to reach the next error handling middleware provided in the express application
    // we are able to do this because we are not in an asynchronous code snippet
    throw error;

    // // This error can be handled like this but this does not use the general error handling function in expressjs
    // // 422 is fail status code
    // return res.status(422).json({
    //   // will be up to our frontend to use this message or not
    //   message: "Validation failed, entered data is incorrect",
    //   // .array() converts the errors into an array of errors
    //   errors: errors.array(),
    // });
  }

  // checks if we are missing a file from the request (multer was unable to add it to the request object)
  if (!req.file) {
    const error = new Error("No image provided");
    error.statusCode = 422;
    throw Error;
  }

  //otherwise, multer was able to extract a valid file
  // the path may have "\\" which is caused by windows systems
  // file.path gets the path to the file on the server which it is stored on
  const imageUrl = req.file.path.replace("\\", "/");

  // extract information from body of request
  const title = req.body.title;
  const content = req.body.content;
  let creator;

  // create a new post for the DB
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    // We have the userId in the request object from the token that the client sent for authentication
    // It is extracted and placed on the request object in is-auth.js
    // The user's ID is placed on the token and sent to the client on the 'login' controller action when
    // the token is generated
    creator: req.userId,
  });

  // .save() saves the document to the db and returns a promise with the document that was saved
  post
    .save()
    .then((result) => {
      // Now we must add the post to the list of posts for the associated User document
      // First, get the user mongoose model from the database
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;

      // push the newly created post object to the list of posts for this user
      // mongoose will automatically pull out the postID and add it to the user object
      user.posts.push(post);

      return user.save();
    })
    .then((result) => {
      // 201 is the status code to use if we want to tell the client: success a resource was created
      res.status(201).json({
        message: "Post created successfully",
        post: post,
        creator: {
          _id: creator._id,
          name: creator.name,
        },
      });
    })
    // something goes wrong with saving to the db
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      // "throw err" will not let us go to the next error handling middleware since we
      // are currently in asynchronous code => we are in a .catch block
      // Instead we must call next() with the error object passed in for it to reach the next
      // error handling middleware
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  // get postId from the dynamic route
  const postId = req.params.postId;

  // get the post with this id from the database
  Post.findById(postId)
    .then((post) => {
      // check if the post was not found
      if (!post) {
        // throw a new error
        const error = new Error("Could not find post");
        // 404 is a not found error
        error.statusCode = 404;

        // if you throw an error inside of a .then() block the very next .catch()
        // block that is at the same indentation will be reached and that error object will be passed to the catch block
        throw error;
      }

      // we have found the post
      res.status(200).json({ message: "Post fetched", post: post });
    })
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      // "throw err" will not let us go to the next error handling middleware since we
      // are currently in asynchronous code
      // Instead we must call next() with the error object passed in for it to reach the next
      // error handling middleware
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  // extracts any eorrs the validation package gathered
  const errors = validator.validationResult(req);

  // we have errors
  if (!errors.isEmpty()) {
    // create new error object
    const error = new Error("Validation failed, entered data is incorrect");

    // add our customer property called "statusCode"
    // 422 is a validation error
    error.statusCode = 422;

    // throwing the error will automatically exit the function execution and instead
    // try to reach the next error handling middleware provided in the express application
    // we are able to do this because we are not in an asynchronous code snippet
    throw error;
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;

  // if no new file was added, the 'req.body.image' will just
  // be some text in the request body that was added from when the post was created (the frontend code
  // will have the logic to take the existing URL and just add it to the request)
  let imageUrl = req.body.image;

  // if a new file is added, then req.file will be set by multer and thus,
  // we should overwrite the imageUrl
  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }

  // if we did not get the URL from the body or from the req.file, error
  if (!imageUrl) {
    const error = new Error("No image file picked");
    error.statusCode = 422;
    throw error;
  }

  // update the edited post in the database
  Post.findById(postId)
    .then((post) => {
      // did not find a post
      if (!post) {
        // throw a new error
        const error = new Error("Could not find post");
        // 404 is a not found error
        error.statusCode = 404;

        // if you throw an error inside of a .then() block the very next .catch()
        // block will be reached and that error object will be passed to the catch block
        throw error;
      }

      // check if the user trying to update the post is not the creator of the post
      // req.userId is from the token
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized");
        error.statusCode = 403;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        // if the imageUrl has changed, delete the old image from the file system
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      // save post in db which returns a promise
      return post.save();
    })

    .then((result) => {
      // result is the post that is saved to the db
      res.status(200).json({ message: "Post updated", post: result });
    })
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      // "throw err" will not let us go to the next error handling middleware since we
      // are currently in asynchronous code
      // Instead we must call next() with the error object passed in for it to reach the next
      // error handling middleware
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      // did not find a post
      if (!post) {
        // throw a new error
        const error = new Error("Could not find post");
        // 404 is a not found error
        error.statusCode = 404;

        // if you throw an error inside of a .then() block the very next .catch()
        // block will be reached and that error object will be passed to the catch block
        throw error;
      }

      // check if the user trying to delete the post is not the creator of the post
      // if the user is not the creator, throw error
      // req.userId is from the token
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized");
        error.statusCode = 403;
        throw error;
      }

      // delete the image of the post
      clearImage(post.imageUrl);

      // delete post from the database
      return Post.findByIdAndRemove(postId);
    })
    .then((result) => {
      // now, we must delete the post from the user model as well (in the 'posts' field of the user)
      // first, get the user model
      return User.findById(req.userId);
    })
    .then((user) => {
      // .pull() will remove the id that is passed in
      // pass in the id of the post we want to remove from the user model
      user.posts.pull(postId);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Deleted post" });
    })
    .catch((err) => {
      // if the error does not have a statusCode variable, add it
      if (!err.statusCode) {
        // 500 is a server side error
        err.statusCode = 500;
      }

      // "throw err" will not let us go to the next error handling middleware since we
      // are currently in asynchronous code
      // Instead we must call next() with the error object passed in for it to reach the next
      // error handling middleware
      next(err);
    });
};

// helper function to delete image
// filePath = "images/imageName"
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);

  fs.unlink(filePath, (err) => console.log(err));
};
