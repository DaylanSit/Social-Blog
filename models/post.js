const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// defines how a post should look like in our db
const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },

    // link to a user
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  // second parameter is the options of this Schema constructor
  // Mongoose will now automatically add timestamps when a new object is added to the database
  // Automatically get createdAt and updatedAt timestamps
  { timestamps: true }
);

// export a model based on this Schema
module.exports = mongoose.model("Post", postSchema);
