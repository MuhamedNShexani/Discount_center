const mongoose = require("mongoose");
const Company = require("./models/Company");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testCompanyCreation() {
  try {
    console.log("Connecting to database...");
    await mongoose.connection.asPromise();
    console.log("Connected to MongoDB");

    // Test company data
    const testCompany = {
      name: "Test Company",
      logo: "/uploads/test-logo.jpg",
      address: "Test Address",
      phone: "123-456-7890",
      description: "Test company description",
    };

    console.log("Creating test company...");
    const company = new Company(testCompany);
    const savedCompany = await company.save();

    console.log("Company created successfully:");
    console.log("- ID:", savedCompany._id);
    console.log("- Name:", savedCompany.name);
    console.log("- Logo:", savedCompany.logo);
    console.log("- Address:", savedCompany.address);
    console.log("- Phone:", savedCompany.phone);
    console.log("- Description:", savedCompany.description);

    // Clean up - delete the test company
    await Company.findByIdAndDelete(savedCompany._id);
    console.log("Test company deleted successfully");

    console.log("✅ Company creation test passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Company creation test failed:", error);
    process.exit(1);
  }
}

testCompanyCreation();
