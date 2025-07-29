const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// Import models
const User = require("./models/User");
const Product = require("./models/Product");

const testUserTracking = async () => {
  try {
    await connectDB();

    // Clear existing test data
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Get some products to work with
    const products = await Product.find().limit(5);
    if (products.length === 0) {
      console.log("No products found. Please add some products first.");
      return;
    }

    console.log(`Found ${products.length} products to work with`);

    // Create test users with different device IDs
    const testUsers = [
      {
        deviceId: "test-device-1",
        likedProducts: [products[0]._id, products[1]._id],
        viewedProducts: [
          {
            productId: products[0]._id,
            viewCount: 3,
            lastViewed: new Date(),
          },
          {
            productId: products[1]._id,
            viewCount: 2,
            lastViewed: new Date(),
          },
        ],
        reviews: [
          {
            productId: products[0]._id,
            rating: 5,
            comment: "Great product!",
            createdAt: new Date(),
          },
        ],
      },
      {
        deviceId: "test-device-2",
        likedProducts: [products[2]._id],
        viewedProducts: [
          {
            productId: products[2]._id,
            viewCount: 1,
            lastViewed: new Date(),
          },
        ],
        reviews: [
          {
            productId: products[2]._id,
            rating: 4,
            comment: "Good quality",
            createdAt: new Date(),
          },
        ],
      },
    ];

    // Create users
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user with device ID: ${userData.deviceId}`);
    }

    // Update product stats
    for (const product of products) {
      // Count likes from users
      const likeCount = await User.countDocuments({
        likedProducts: product._id,
      });

      // Count views from users
      const viewCount = await User.aggregate([
        { $unwind: "$viewedProducts" },
        { $match: { "viewedProducts.productId": product._id } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$viewedProducts.viewCount" },
          },
        },
      ]);

      // Calculate average rating
      const ratingData = await User.aggregate([
        { $unwind: "$reviews" },
        { $match: { "reviews.productId": product._id } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$reviews.rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ]);

      // Update product
      await Product.findByIdAndUpdate(product._id, {
        likeCount: likeCount,
        viewCount: viewCount.length > 0 ? viewCount[0].totalViews : 0,
        averageRating: ratingData.length > 0 ? ratingData[0].avgRating : 0,
        reviewCount: ratingData.length > 0 ? ratingData[0].reviewCount : 0,
      });

      console.log(
        `Updated product ${product.name}: ${likeCount} likes, ${
          viewCount.length > 0 ? viewCount[0].totalViews : 0
        } views, ${
          ratingData.length > 0 ? ratingData[0].avgRating.toFixed(1) : 0
        } avg rating`
      );
    }

    console.log("User tracking test data created successfully!");
    console.log("Test device IDs:");
    console.log("- test-device-1");
    console.log("- test-device-2");
  } catch (error) {
    console.error("Error creating test data:", error);
  } finally {
    mongoose.connection.close();
  }
};

testUserTracking();
