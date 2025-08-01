const mongoose = require("mongoose");
const Gift = require("./models/Gift");
const Store = require("./models/Store");
const Brand = require("./models/Brand");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const addSampleGifts = async () => {
  try {
    // Get some existing stores and brands
    const stores = await Store.find().limit(3);
    const brands = await Brand.find().limit(3);

    if (stores.length === 0) {
      console.log("No stores found. Please add some stores first.");
      return;
    }

    if (brands.length === 0) {
      console.log("No brands found. Please add some brands first.");
      return;
    }

    // Sample gifts data
    const sampleGifts = [
      {
        image: "/uploads/gift1.jpg",
        description: "Special discount voucher for electronics",
        storeId: [stores[0]._id],
        brandId: brands[0]._id,
        productId: "PROD001",
        expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        image: "/uploads/gift2.jpg",
        description: "Free delivery on all orders",
        storeId: [stores[1]._id],
        brandId: brands[1]._id,
        productId: "PROD002",
        expireDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
      {
        image: "/uploads/gift3.jpg",
        description: "Buy one get one free offer",
        storeId: [stores[0]._id, stores[2]._id],
        brandId: brands[2]._id,
        productId: "PROD003",
        expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        image: "/uploads/gift4.jpg",
        description: "20% off on all clothing items",
        storeId: [stores[1]._id],
        brandId: null,
        productId: "PROD004",
        expireDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      },
      {
        image: "/uploads/gift5.jpg",
        description: "Free gift with purchase over $50",
        storeId: [stores[2]._id],
        brandId: brands[0]._id,
        productId: "PROD005",
        expireDate: null, // No expiry
      },
    ];

    // Clear existing gifts
    await Gift.deleteMany({});
    console.log("Cleared existing gifts");

    // Add new gifts
    const createdGifts = await Gift.insertMany(sampleGifts);
    console.log(`Added ${createdGifts.length} sample gifts`);

    // Display the created gifts
    console.log("\nCreated gifts:");
    createdGifts.forEach((gift, index) => {
      console.log(`${index + 1}. ${gift.description}`);
    });
  } catch (error) {
    console.error("Error adding sample gifts:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
};

addSampleGifts();
