const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
  user1: { type: Schema.Types.ObjectId, ref: "User", required: true },
  user2: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Export model
module.exports = mongoose.model("Thread", ThreadSchema);
