const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { deleteUserAndAssociatedData } = require("./deleteUserAndAssociatedData");

const GRACE_DAYS = 30;

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    // Validate username length (min 3 characters to match User model)
    if (username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const emailOrUsername = (req.body.email || "").trim();
    const password = (req.body.password || "").trim();

    // Validate required fields
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email (lowercase) or username
    const isEmail = emailOrUsername.includes("@");
    const user = await User.findOne(
      isEmail
        ? { email: emailOrUsername.toLowerCase() }
        : { username: emailOrUsername },
    );

    if (!user) {
      console.log(
        "[Login] User not found:",
        isEmail ? "email" : "username",
        isEmail
          ? emailOrUsername.toLowerCase().slice(0, 3) + "..."
          : emailOrUsername.slice(0, 3) + "...",
      );
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      console.log("[Login] User has no password (possibly anonymous account)");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Deactivated account: reactivate within grace period or delete if past
    if (!user.isActive && user.scheduledDeletionAt) {
      const now = new Date();
      if (now >= user.scheduledDeletionAt) {
        await deleteUserAndAssociatedData(user._id);
        return res.status(401).json({
          success: false,
          message: "Account has been permanently deleted after the grace period",
        });
      }
      // Within grace period: verify password first, then reactivate
      const isPasswordValid = await user.comparePassword((password || "").trim());
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
      user.isActive = true;
      user.deactivatedAt = undefined;
      user.scheduledDeletionAt = undefined;
      user.lastLogin = new Date();
      await user.save();
      const token = generateToken(user._id);
      return res.json({
        success: true,
        data: { user: user.getPublicProfile(), token },
        message: "Login successful. Account reactivated.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Check password (trim to avoid accidental spaces)
    const isPasswordValid = await user.comparePassword((password || "").trim());
    if (!isPasswordValid) {
      console.log(
        "[Login] Wrong password for user:",
        user.email || user.username,
      );
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        token,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const publicProfile = user.getPublicProfile();

    res.json({
      success: true,
      data: {
        user: publicProfile,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { displayName, avatar } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (displayName !== undefined) user.displayName = displayName && displayName.trim() ? displayName.trim() : null;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Deactivate account (30-day grace period, then permanent deletion)
// @route   POST /api/auth/deactivate
// @access  Private
const deactivate = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (!user.username && user.deviceId) {
      return res.status(400).json({
        success: false,
        message: "Guest accounts cannot be deactivated",
      });
    }

    const now = new Date();
    const scheduledDeletionAt = new Date(now);
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + GRACE_DAYS);

    user.isActive = false;
    user.deactivatedAt = now;
    user.scheduledDeletionAt = scheduledDeletionAt;
    await user.save();

    res.json({
      success: true,
      message: "Account deactivated. You have 30 days to log in again to reactivate.",
      data: { scheduledDeletionAt: user.scheduledDeletionAt },
    });
  } catch (error) {
    console.error("Deactivate error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  deactivate,
};
