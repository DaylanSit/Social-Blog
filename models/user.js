const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  name: {
    type: String,
    reqiored: true,
  },

  status: {
    type: String,
    default: "I am new!",
  },

  // posts will be an array
  posts: [
    {
      // For each object in the array, it will be a reference to a Post
      // Therefore, we add a 'ref' key and add the Post model
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
