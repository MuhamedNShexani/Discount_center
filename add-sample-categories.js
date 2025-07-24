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

// Category Schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: false,
  },
  icon: {
    type: String,
    required: false,
  },
  types: [
    {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: false,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Category = mongoose.model("Category", categorySchema);

// Sample categories with their types
const sampleCategories = [
  {
    name: "Morning Products",
    description: "Products typically consumed in the morning",
    icon: "🌅",
    types: [
      { name: "Omelet", description: "Egg-based breakfast dishes" },
      { name: "Cheese", description: "Various types of cheese" },
      { name: "Bread", description: "Fresh bread and pastries" },
      { name: "Milk", description: "Dairy milk products" },
      { name: "Cereal", description: "Breakfast cereals" },
      { name: "Coffee", description: "Coffee and coffee products" },
      { name: "Tea", description: "Tea and tea products" },
      { name: "Jam", description: "Jams and spreads" },
      { name: "Butter", description: "Butter and margarine" },
      { name: "Honey", description: "Natural honey products" },
    ],
  },
  {
    name: "Electronics",
    description: "Electronic devices and accessories",
    icon: "📱",
    types: [
      { name: "Phone", description: "Mobile phones and smartphones" },
      { name: "Laptop", description: "Laptop computers" },
      { name: "Tablet", description: "Tablet devices" },
      { name: "TV", description: "Television sets" },
      { name: "Headphones", description: "Audio headphones and earbuds" },
      { name: "Camera", description: "Digital cameras and accessories" },
      { name: "Speaker", description: "Audio speakers and sound systems" },
      { name: "Charger", description: "Charging cables and adapters" },
      { name: "Gaming", description: "Gaming consoles and accessories" },
      { name: "Smartwatch", description: "Smart watches and fitness trackers" },
    ],
  },
  {
    name: "Clothing",
    description: "Apparel and fashion items",
    icon: "👕",
    types: [
      { name: "Shirt", description: "T-shirts, polo shirts, and dress shirts" },
      { name: "Pants", description: "Jeans, trousers, and shorts" },
      { name: "Shoes", description: "Footwear for all occasions" },
      { name: "Dress", description: "Dresses and formal wear" },
      { name: "Jacket", description: "Jackets and coats" },
      { name: "Hat", description: "Caps, hats, and headwear" },
      { name: "Socks", description: "Socks and hosiery" },
      { name: "Underwear", description: "Underwear and intimate apparel" },
      { name: "Scarf", description: "Scarves and winter accessories" },
      { name: "Bag", description: "Handbags, backpacks, and luggage" },
    ],
  },
  {
    name: "Home & Garden",
    description: "Home improvement and garden products",
    icon: "🏠",
    types: [
      { name: "Furniture", description: "Home furniture and decor" },
      { name: "Kitchen", description: "Kitchen appliances and utensils" },
      { name: "Bathroom", description: "Bathroom fixtures and accessories" },
      { name: "Garden", description: "Garden tools and plants" },
      { name: "Lighting", description: "Lighting fixtures and bulbs" },
      { name: "Cleaning", description: "Cleaning supplies and tools" },
      { name: "Storage", description: "Storage solutions and organizers" },
      { name: "Bedding", description: "Bedding and linens" },
      { name: "Paint", description: "Paints and painting supplies" },
      { name: "Tools", description: "Hand tools and power tools" },
    ],
  },
  {
    name: "Food & Beverages",
    description: "Food and beverage products",
    icon: "🍎",
    types: [
      { name: "Fruits", description: "Fresh fruits and dried fruits" },
      { name: "Vegetables", description: "Fresh vegetables and greens" },
      { name: "Meat", description: "Fresh meat and poultry" },
      { name: "Fish", description: "Fresh fish and seafood" },
      { name: "Grains", description: "Rice, pasta, and grains" },
      { name: "Snacks", description: "Chips, nuts, and snack foods" },
      { name: "Beverages", description: "Soft drinks and juices" },
      { name: "Canned", description: "Canned foods and preserves" },
      { name: "Frozen", description: "Frozen foods and ice cream" },
      { name: "Organic", description: "Organic and natural foods" },
    ],
  },
];

// Add sample categories to database
const addSampleCategories = async () => {
  try {
    // Clear existing categories
    await Category.deleteMany({});
    console.log("Cleared existing categories");

    // Add new categories
    for (const categoryData of sampleCategories) {
      const category = new Category(categoryData);
      await category.save();
      console.log(
        `Added category: ${categoryData.name} with ${categoryData.types.length} types`
      );
    }

    console.log("Sample categories added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding sample categories:", error);
    process.exit(1);
  }
};

// Run the script
connectDB().then(() => {
  addSampleCategories();
});
