const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  thread: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
  viewed: { type: Boolean, required: true },
});

// Export model
module.exports = mongoose.model("Message", MessageSchema);
