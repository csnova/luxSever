const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: { type: String, required: true, maxLength: 100 },
  username: { type: String, required: true, maxLength: 100 },
  password: { type: String, required: true, maxLength: 100 },
});

// A static method to the User model for finding a user by username
UserSchema.statics.findByUsername = async function (username) {
  return this.findOne({ username });
};

// Export model
module.exports = mongoose.model("User", UserSchema);
