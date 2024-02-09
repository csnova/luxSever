const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  first_name: { type: String, required: true, maxLength: 100 },
  last_name: { type: String, required: true, maxLength: 100 },
  bio: { type: String, required: true, maxLength: 1000 },
  picture: {
    data: Buffer,
    contentType: String,
  },
});

// Export model
module.exports = mongoose.model("Profile", ProfileSchema);
