const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FollowSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  following: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  followers: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
});

// Export model
module.exports = mongoose.model("Follow", FollowSchema);
