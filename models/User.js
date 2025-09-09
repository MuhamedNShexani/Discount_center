const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Authentication fields (required for registered users, optional for anonymous)
  username: {
    type: String,
    required: function () {
      return !this.deviceId;
    }, // Only required if no deviceId
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: function () {
      return !this.deviceId;
    }, // Only required if no deviceId
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.deviceId;
    }, // Only required if no deviceId
    minlength: 6,
  },

  // Profile fields (required for registered users, optional for anonymous)
  firstName: {
    type: String,
    required: function () {
      return !this.deviceId;
    }, // Only required if no deviceId
    trim: true,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: function () {
      return !this.deviceId;
    }, // Only required if no deviceId
    trim: true,
    maxlength: 50,
  },
  phone: {
    type: String,
    required: function () {
      return !this.deviceId;
    }, // Only required if no deviceId
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
  },
  avatar: {
    type: String,
  },

  // Anonymous user tracking (for non-logged users)
  deviceId: {
    type: String,
    required: false,
    // Removed unique constraint to allow multiple registered users without deviceId
    sparse: true,
  },
  sessionId: {
    type: String,
    required: false,
  },

  // User preferences and tracking
  likedProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  viewedProducts: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      viewCount: {
        type: Number,
        default: 1,
      },
      lastViewed: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // User reviews (only for logged users)
  reviews: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        maxlength: 500,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

// Hash password before saving (only for registered users with passwords)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastActive on save
userSchema.pre("save", function (next) {
  this.lastActive = Date.now();
  next();
});

// Method to compare password (only for registered users)
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Anonymous users don't have passwords
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name (for registered users)
userSchema.methods.getFullName = function () {
  if (!this.firstName || !this.lastName) return "Anonymous User";
  return `${this.firstName} ${this.lastName}`;
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
  try {
    if (this.deviceId && !this.username) {
      // Anonymous user
      return {
        _id: this._id,
        deviceId: this.deviceId,
        isAnonymous: true,
        likedProducts: this.likedProducts,
        viewedProducts: this.viewedProducts,
        createdAt: this.createdAt,
      };
    }

    // Registered user
    return {
      _id: this._id,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      avatar: this.avatar,
      isActive: this.isActive,
      likedProducts: this.likedProducts,
      viewedProducts: this.viewedProducts,
      reviews: this.reviews,
      createdAt: this.createdAt,
    };
  } catch (error) {
    console.error("Error in getPublicProfile:", error);
    // Return a safe fallback profile
    return {
      _id: this._id,
      username: this.username || "Unknown",
      firstName: this.firstName || "Unknown",
      lastName: this.lastName || "User",
      email: this.email || "",
      isActive: this.isActive || false,
      likedProducts: this.likedProducts || [],
      viewedProducts: this.viewedProducts || [],
      reviews: this.reviews || [],
      createdAt: this.createdAt,
    };
  }
};

module.exports = mongoose.model("User", userSchema);
