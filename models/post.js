const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
});

// Export model
module.exports = mongoose.model("Post", PostSchema);
