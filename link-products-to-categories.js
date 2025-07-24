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

// Import models
const Product = require("./models/Product");
const Category = require("./models/Category");

// Category mapping based on product type
const categoryMapping = {
  // Morning Products
  Bread: "Morning Products",
  Cheese: "Morning Products",
  Milk: "Morning Products",
  Coffee: "Morning Products",
  Tea: "Morning Products",
  Butter: "Morning Products",
  Jam: "Morning Products",
  Honey: "Morning Products",
  Cereal: "Morning Products",
  Omelet: "Morning Products",
  خوارده‌مه‌نی: "Morning Products", // Kurdish for "Food"
  "چای و قاوه‌": "Morning Products", // Kurdish for "Tea and Coffee"
  "شیر و دایبی": "Morning Products", // Kurdish for "Milk and Dairy"
  شیر: "Morning Products", // Kurdish for "Milk"
  "چا و قاوە": "Morning Products", // Kurdish for "Tea and Coffee"
  نان: "Morning Products", // Kurdish for "Bread"
  پاقلاوه‌: "Morning Products", // Kurdish for "Baklava"

  // Electronics
  Phone: "Electronics",
  Laptop: "Electronics",
  Tablet: "Electronics",
  TV: "Electronics",
  Headphones: "Electronics",
  Camera: "Electronics",
  Speaker: "Electronics",
  Charger: "Electronics",
  Gaming: "Electronics",
  Smartwatch: "Electronics",
  "كارتى مۆبایل": "Electronics", // Kurdish for "Mobile Cards"
  كاره‌با: "Electronics", // Kurdish for "Electronics"
  مۆبايل: "Electronics", // Kurdish for "Mobile"

  // Clothing
  Shirt: "Clothing",
  Pants: "Clothing",
  Shoes: "Clothing",
  Dress: "Clothing",
  Jacket: "Clothing",
  Hat: "Clothing",
  Socks: "Clothing",
  Underwear: "Clothing",
  Scarf: "Clothing",
  Bag: "Clothing",

  // Home & Garden
  Furniture: "Home & Garden",
  Kitchen: "Home & Garden",
  Bathroom: "Home & Garden",
  Garden: "Home & Garden",
  Lighting: "Home & Garden",
  Cleaning: "Home & Garden",
  Storage: "Home & Garden",
  Bedding: "Home & Garden",
  Paint: "Home & Garden",
  Tools: "Home & Garden",
  پاککەرەوە: "Home & Garden", // Kurdish for "Cleaning"
  كلێنكس: "Home & Garden", // Kurdish for "Cleaning"
  شوشه‌وات: "Home & Garden", // Kurdish for "Kitchenware"
  "پلاستیك و سه‌فه‌ری": "Home & Garden", // Kurdish for "Plastic and Silverware"
  په‌روارگه‌: "Home & Garden", // Kurdish for "Stationery"
  "یاری مندالان": "Home & Garden", // Kurdish for "Children's Toys"
  كماليات: "Home & Garden", // Kurdish for "Kitchenware"
  "ئاوی كارتۆن": "Home & Garden", // Kurdish for "Cardboard Water"
  گشتی: "Home & Garden", // Kurdish for "General"
  سەفەری: "Home & Garden", // Kurdish for "Travel"
  سەهۆل: "Home & Garden", // Kurdish for "Carpet"

  // Food & Beverages
  Fruits: "Food & Beverages",
  Vegetables: "Food & Beverages",
  Meat: "Food & Beverages",
  Fish: "Food & Beverages",
  Grains: "Food & Beverages",
  Snacks: "Food & Beverages",
  Beverages: "Food & Beverages",
  Canned: "Food & Beverages",
  Frozen: "Food & Beverages",
  Organic: "Food & Beverages",
  ساردكه‌ره‌وه‌: "Food & Beverages", // Kurdish for "Frozen"
  "داخراو 4": "Food & Beverages", // Arabic for "Canned 4"
  "داخراو 5": "Food & Beverages", // Arabic for "Canned 5"
  دانه‌وێلا: "Food & Beverages", // Kurdish for "Grains"
  خواردنه‌وه‌: "Food & Beverages", // Kurdish for "Beverages"
  چەرەزات: "Food & Beverages", // Kurdish for "Snacks"
  كیك: "Food & Beverages", // Kurdish for "Cake"
  "برنج 18 كغم": "Food & Beverages", // Rice 18kg
  "برنج 20 كغم": "Food & Beverages", // Rice 20kg
  "برنج 24 كغم": "Food & Beverages", // Rice 24kg
  "برنج 25 كغم": "Food & Beverages", // Rice 25kg
  "برنج 30 كغم": "Food & Beverages", // Rice 30kg
  "برنج 35 كغم": "Food & Beverages", // Rice 35kg
  "دهن 18 لتر": "Food & Beverages", // Oil 18L
  شه‌كر: "Food & Beverages", // Sugar
  ئارد: "Food & Beverages", // Flour
  ئاو: "Food & Beverages", // Water
  برنج: "Food & Beverages", // Rice
  "زەیت و ڕۆن": "Food & Beverages", // Oil and Ghee
  بەڕاد: "Food & Beverages", // Dairy
  گۆشت: "Food & Beverages", // Meat
  "گۆشتی بەستو": "Food & Beverages", // Frozen Meat
  "گۆشتی قەصاب": "Food & Beverages", // Butcher Meat
  مریشك: "Food & Beverages", // Chicken
  هێلكه‌: "Food & Beverages", // Eggs
  "سەوزە و میوە": "Food & Beverages", // Vegetables and Fruits
  معلبات: "Food & Beverages", // Pickles
  "شەعریە و مەعکەڕۆنى": "Food & Beverages", // Pasta and Macaroni
  ئاوەتەماتە: "Food & Beverages", // Tomato Paste
  خوێ: "Food & Beverages", // Salt
  "ئاوی 17 لتر": "Food & Beverages", // Water 17L
};

// Link products to categories
const linkProductsToCategories = async () => {
  try {
    console.log("Starting to link products to categories...");

    // Get all categories
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    console.log("Available categories:", Object.keys(categoryMap));

    // Get all products without categoryId
    const productsWithoutCategory = await Product.find({
      categoryId: { $exists: false },
    });
    console.log(
      `Found ${productsWithoutCategory.length} products without category`
    );

    let linkedCount = 0;
    let skippedCount = 0;

    for (const product of productsWithoutCategory) {
      const categoryName = categoryMapping[product.type];

      if (categoryName && categoryMap[categoryName]) {
        // Update product with categoryId
        await Product.findByIdAndUpdate(product._id, {
          categoryId: categoryMap[categoryName],
        });

        console.log(
          `✅ Linked "${product.name}" (${product.type}) to "${categoryName}"`
        );
        linkedCount++;
      } else {
        console.log(
          `❌ Could not find category for "${product.name}" (${product.type})`
        );
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully linked: ${linkedCount} products`);
    console.log(`❌ Skipped: ${skippedCount} products`);
    console.log(
      `📝 Total processed: ${productsWithoutCategory.length} products`
    );

    // Show products that still need manual linking
    if (skippedCount > 0) {
      console.log(`\n🔍 Products that need manual category assignment:`);
      const remainingProducts = await Product.find({
        categoryId: { $exists: false },
      });
      remainingProducts.forEach((product) => {
        console.log(`- "${product.name}" (Type: ${product.type})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error linking products to categories:", error);
    process.exit(1);
  }
};

// Manual category assignment function
const assignCategoryManually = async (productId, categoryId) => {
  try {
    const result = await Product.findByIdAndUpdate(
      productId,
      {
        categoryId: categoryId,
      },
      { new: true }
    );

    if (result) {
      console.log(
        `✅ Successfully assigned category to product: ${result.name}`
      );
      return result;
    } else {
      console.log(`❌ Product not found: ${productId}`);
      return null;
    }
  } catch (error) {
    console.error("Error assigning category:", error);
    return null;
  }
};

// List all categories with their IDs
const listCategories = async () => {
  try {
    const categories = await Category.find({});
    console.log("\n📋 Available Categories:");
    categories.forEach((cat) => {
      console.log(`ID: ${cat._id} | Name: ${cat.name} | Icon: ${cat.icon}`);
      console.log(`  Types: ${cat.types.map((t) => t.name).join(", ")}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error listing categories:", error);
  }
};

// Main execution
const main = async () => {
  await connectDB();

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.includes("--list-categories")) {
    await listCategories();
  } else if (args.includes("--manual")) {
    const productId = args[args.indexOf("--manual") + 1];
    const categoryId = args[args.indexOf("--manual") + 2];

    if (productId && categoryId) {
      await assignCategoryManually(productId, categoryId);
    } else {
      console.log(
        "Usage: node link-products-to-categories.js --manual <productId> <categoryId>"
      );
    }
  } else {
    await linkProductsToCategories();
  }

  process.exit(0);
};

main();
