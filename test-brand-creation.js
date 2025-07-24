const mongoose = require("mongoose");
const Brand = require("./models/Brand");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testBrandCreation() {
  try {
    console.log("Connecting to database...");
    await mongoose.connection.asPromise();
    console.log("Connected to MongoDB");

    // Test brand data
    const testBrand = {
      name: "Test Brand",
      logo: "/uploads/test-logo.jpg",
      address: "Test Address",
      phone: "123-456-7890",
      description: "Test brand description",
    };

    console.log("Creating test brand...");
    const brand = new Brand(testBrand);
    const savedBrand = await brand.save();

    console.log("Brand created successfully:");
    console.log("- ID:", savedBrand._id);
    console.log("- Name:", savedBrand.name);
    console.log("- Logo:", savedBrand.logo);
    console.log("- Address:", savedBrand.address);
    console.log("- Phone:", savedBrand.phone);
    console.log("- Description:", savedBrand.description);

    // Clean up - delete the test brand
    await Brand.findByIdAndDelete(savedBrand._id);
    console.log("Test brand deleted successfully");

    console.log("✅ Brand creation test passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Brand creation test failed:", error);
    process.exit(1);
  }
}

testBrandCreation();
