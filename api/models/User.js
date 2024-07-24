const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  imagePath: { type: String } // Ensure imagePath is included in the schema
}, { timestamps: true });

const UserModel = mongoose.model('User' , UserSchema);
module.exports = UserModel