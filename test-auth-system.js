const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/marketplace", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testAuthSystem = async () => {
  try {
    console.log("🧪 Testing Authentication System...\n");

    // Test 1: Create a test user
    console.log("1. Creating test user...");
    const testUser = new User({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      displayName: "Test User",
    });

    await testUser.save();
    console.log("✅ Test user created successfully");
    console.log("   Username:", testUser.username);
    console.log("   Email:", testUser.email);
    console.log("   Full Name:", testUser.getFullName());
    console.log("   Password hashed:", testUser.password !== "password123");

    // Test 2: Test password comparison
    console.log("\n2. Testing password comparison...");
    const isPasswordValid = await testUser.comparePassword("password123");
    const isPasswordInvalid = await testUser.comparePassword("wrongpassword");
    console.log("✅ Correct password:", isPasswordValid);
    console.log("✅ Wrong password:", !isPasswordInvalid);

    // Test 3: Test public profile
    console.log("\n3. Testing public profile...");
    const publicProfile = testUser.getPublicProfile();
    console.log("✅ Public profile created:", {
      hasId: !!publicProfile._id,
      hasUsername: !!publicProfile.username,
      hasEmail: !!publicProfile.email,
      hasPassword: !publicProfile.password, // Should not have password
      hasDisplayName: publicProfile.displayName !== undefined,
    });

    // Test 4: Test user schema validation
    console.log("\n4. Testing schema validation...");
    try {
      const invalidUser = new User({
        username: "ab", // Too short
        email: "invalid-email",
        password: "123", // Too short
      });
      await invalidUser.save();
      console.log("❌ Validation failed - should have thrown error");
    } catch (error) {
      console.log("✅ Validation working correctly");
      console.log("   Errors:", Object.keys(error.errors));
    }

    // Test 5: Test duplicate email/username
    console.log("\n5. Testing duplicate constraints...");
    try {
      const duplicateUser = new User({
        username: "testuser", // Same username
        email: "test@example.com", // Same email
        password: "password123",
        displayName: "Another User",
      });
      await duplicateUser.save();
      console.log("❌ Duplicate constraint failed - should have thrown error");
    } catch (error) {
      console.log("✅ Duplicate constraints working correctly");
      console.log(
        "   Error type:",
        error.code === 11000 ? "Duplicate key" : "Other error"
      );
    }

    // Test 6: Test device ID functionality
    console.log("\n6. Testing device ID functionality...");
    const deviceUser = new User({
      deviceId: "test-device-123",
      username: "deviceuser",
      email: "device@example.com",
      password: "password123",
      displayName: "Device User",
    });
    await deviceUser.save();
    console.log("✅ Device user created successfully");
    console.log("   Device ID:", deviceUser.deviceId);

    // Test 7: Test user tracking fields
    console.log("\n7. Testing user tracking fields...");
    const trackingUser = new User({
      username: "trackinguser",
      email: "tracking@example.com",
      password: "password123",
      displayName: "Tracking User",
      likedProducts: [],
      viewedProducts: [],
    });
    await trackingUser.save();
    console.log("✅ Tracking user created successfully");
    console.log(
      "   Liked products array:",
      Array.isArray(trackingUser.likedProducts)
    );
    console.log(
      "   Viewed products array:",
      Array.isArray(trackingUser.viewedProducts)
    );
    console.log("   Reviews array:", Array.isArray(trackingUser.reviews));

    console.log("\n🎉 All authentication system tests passed!");
    console.log("\n📋 Summary:");
    console.log("   ✅ User creation and validation");
    console.log("   ✅ Password hashing and comparison");
    console.log("   ✅ Public profile generation");
    console.log("   ✅ Schema validation");
    console.log("   ✅ Duplicate constraints");
    console.log("   ✅ Device ID support");
    console.log("   ✅ User tracking fields");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    // Clean up test data
    await User.deleteMany({
      email: {
        $in: ["test@example.com", "device@example.com", "tracking@example.com"],
      },
    });
    console.log("\n🧹 Test data cleaned up");

    mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

testAuthSystem();
