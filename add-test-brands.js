const mongoose = require("mongoose");
const Brand = require("./models/Brand");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testBrands = [
  {
    name: "Tech Solutions Inc.",
    address: "123 Innovation Street, Tech City",
    phone: "+1-555-0123",
    description:
      "Leading technology solutions provider specializing in software development and IT consulting services.",
  },
  {
    name: "Green Energy Co.",
    address: "456 Renewable Avenue, Eco Town",
    phone: "+1-555-0456",
    description:
      "Sustainable energy solutions and renewable technology company committed to environmental protection.",
  },
  {
    name: "Global Foods Ltd.",
    address: "789 Market Square, Food District",
    phone: "+1-555-0789",
    description:
      "International food distribution company offering premium quality products from around the world.",
  },
  {
    name: "Creative Design Studio",
    address: "321 Art Boulevard, Creative Quarter",
    phone: "+1-555-0321",
    description:
      "Award-winning design studio specializing in branding, web design, and creative marketing solutions.",
  },
  {
    name: "Health & Wellness Center",
    address: "654 Wellness Way, Health District",
    phone: "+1-555-0654",
    description:
      "Comprehensive health and wellness services including fitness, nutrition, and preventive care.",
  },
];

async function addTestBrands() {
  try {
    console.log("Connecting to database...");
    await mongoose.connection.asPromise();
    console.log("Connected to MongoDB");

    // Clear existing brands
    await Brand.deleteMany({});
    console.log("Cleared existing brands");

    // Add test brands
    const brands = await Brand.insertMany(testBrands);
    console.log(`Added ${brands.length} test brands:`);

    brands.forEach((brand) => {
      console.log(`- ${brand.name} (ID: ${brand._id})`);
    });

    console.log("Test brands added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding test brands:", error);
    process.exit(1);
  }
}

addTestBrands();
