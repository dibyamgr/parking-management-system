const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema for MongoDB
 * This schema defines the structure of user documents in the database.
 * It includes fields for name, email, password, and role.
 * Passwords are hashed before saving to the database for security.
 * * @typedef {Object} User
 * @property {string} name - The name of the user.
 * @property {string} email - The email address of the user, must be unique.
 * @property {string} password - The user's password, which is hashed before saving.
 * @property {string} role - The role of the user, either 'user' or 'admin'. Defaults to 'user'.
 * * @property {function} comparePassword - Method to compare a candidate password with the hashed password.
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER",
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log(candidatePassword, this.password, "compare----");
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
