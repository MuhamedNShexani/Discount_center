const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// Import Product model
const Product = require("./models/Product");

async function removeTypeField() {
  try {
    await connectDB();

    console.log("Removing 'type' field from all products...");

    // Update all products to remove the type field
    const result = await Product.updateMany(
      {}, // Update all documents
      { $unset: { type: "" } } // Remove the type field
    );

    console.log(
      `✅ Successfully removed 'type' field from ${result.modifiedCount} products`
    );
    console.log(`📊 Total products processed: ${result.matchedCount}`);

    // Verify the field has been removed
    const productsWithType = await Product.find({ type: { $exists: true } });
    console.log(
      `🔍 Products still with 'type' field: ${productsWithType.length}`
    );

    if (productsWithType.length === 0) {
      console.log("✅ All products have been successfully updated!");
    } else {
      console.log("⚠️  Some products still have the 'type' field");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

removeTypeField();
