/**
 * Reset a user's password - use if login fails with "Invalid email or password"
 * Run: node reset-user-password.js <email> <newPassword>
 * Example: node reset-user-password.js user@example.com myNewPassword123
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/storeplace";

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log("Usage: node reset-user-password.js <email> <newPassword>");
    console.log("Example: node reset-user-password.js user@example.com myPassword123");
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.log("Error: Password must be at least 6 characters");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: emailLower }, { username: email }],
    });

    if (!user) {
      console.log("User not found with email/username:", email);
      process.exit(1);
    }

    // Hash and save the new password (bypasses pre-save hook for direct update)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log("Password reset successfully for:", user.email || user.username);
    console.log("You can now login with this new password.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetPassword();
