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

// Category type mapping based on product type
const categoryTypeMapping = {
  // Morning Products
  Bread: { categoryName: "Morning Products", typeName: "Bread" },
  Cheese: { categoryName: "Morning Products", typeName: "Cheese" },
  Milk: { categoryName: "Morning Products", typeName: "Milk" },
  Coffee: { categoryName: "Morning Products", typeName: "Coffee" },
  Tea: { categoryName: "Morning Products", typeName: "Tea" },
  Butter: { categoryName: "Morning Products", typeName: "Butter" },
  Jam: { categoryName: "Morning Products", typeName: "Jam" },
  Honey: { categoryName: "Morning Products", typeName: "Honey" },
  Cereal: { categoryName: "Morning Products", typeName: "Cereal" },
  Omelet: { categoryName: "Morning Products", typeName: "Omelet" },

  // Electronics
  Phone: { categoryName: "Electronics", typeName: "Phone" },
  Laptop: { categoryName: "Electronics", typeName: "Laptop" },
  Tablet: { categoryName: "Electronics", typeName: "Tablet" },
  TV: { categoryName: "Electronics", typeName: "TV" },
  Headphones: { categoryName: "Electronics", typeName: "Headphones" },
  Camera: { categoryName: "Electronics", typeName: "Camera" },
  Speaker: { categoryName: "Electronics", typeName: "Speaker" },
  Watch: { categoryName: "Electronics", typeName: "Watch" },
  Keyboard: { categoryName: "Electronics", typeName: "Keyboard" },
  Mouse: { categoryName: "Electronics", typeName: "Mouse" },

  // Clothing
  Shirt: { categoryName: "Clothing", typeName: "Shirt" },
  Pants: { categoryName: "Clothing", typeName: "Pants" },
  Shoes: { categoryName: "Clothing", typeName: "Shoes" },
  Dress: { categoryName: "Clothing", typeName: "Dress" },
  Jacket: { categoryName: "Clothing", typeName: "Jacket" },
  Hat: { categoryName: "Clothing", typeName: "Hat" },
  Socks: { categoryName: "Clothing", typeName: "Socks" },
  Underwear: { categoryName: "Clothing", typeName: "Underwear" },
  Scarf: { categoryName: "Clothing", typeName: "Scarf" },
  Bag: { categoryName: "Clothing", typeName: "Bag" },

  // Home & Garden
  Furniture: { categoryName: "Home & Garden", typeName: "Furniture" },
  Kitchen: { categoryName: "Home & Garden", typeName: "Kitchen" },
  Tools: { categoryName: "Home & Garden", typeName: "Tools" },
  Garden: { categoryName: "Home & Garden", typeName: "Garden" },
  Lighting: { categoryName: "Home & Garden", typeName: "Lighting" },
  Bathroom: { categoryName: "Home & Garden", typeName: "Bathroom" },
  Bedroom: { categoryName: "Home & Garden", typeName: "Bedroom" },
  "Living Room": { categoryName: "Home & Garden", typeName: "Living Room" },
  Office: { categoryName: "Home & Garden", typeName: "Office" },
  Outdoor: { categoryName: "Home & Garden", typeName: "Outdoor" },

  // Food & Beverages
  Fruits: { categoryName: "Food & Beverages", typeName: "Fruits" },
  Vegetables: { categoryName: "Food & Beverages", typeName: "Vegetables" },
  Meat: { categoryName: "Food & Beverages", typeName: "Meat" },
  Drinks: { categoryName: "Food & Beverages", typeName: "Drinks" },
  Snacks: { categoryName: "Food & Beverages", typeName: "Snacks" },
  Dairy: { categoryName: "Food & Beverages", typeName: "Dairy" },
  Grains: { categoryName: "Food & Beverages", typeName: "Grains" },
  Spices: { categoryName: "Food & Beverages", typeName: "Spices" },
  Canned: { categoryName: "Food & Beverages", typeName: "Canned" },
  Frozen: { categoryName: "Food & Beverages", typeName: "Frozen" },

  // Kurdish/Arabic types
  خوارده‌مه‌نی: { categoryName: "Morning Products", typeName: "Bread" },
  "چای و قاوه‌": { categoryName: "Morning Products", typeName: "Tea" },
  "شیر و دایبی": { categoryName: "Morning Products", typeName: "Milk" },
  شیر: { categoryName: "Morning Products", typeName: "Milk" },
  "چا و قاوە": { categoryName: "Morning Products", typeName: "Coffee" },
  نان: { categoryName: "Morning Products", typeName: "Bread" },
  پەنیر: { categoryName: "Morning Products", typeName: "Cheese" },
  کەرە: { categoryName: "Morning Products", typeName: "Butter" },
  هەنگوین: { categoryName: "Morning Products", typeName: "Honey" },
  مەرەمەر: { categoryName: "Morning Products", typeName: "Jam" },
  گەنمەشامی: { categoryName: "Morning Products", typeName: "Cereal" },
  هێلکە: { categoryName: "Morning Products", typeName: "Omelet" },

  // Electronics in Kurdish
  مۆبایل: { categoryName: "Electronics", typeName: "Phone" },
  کۆمپیوتەر: { categoryName: "Electronics", typeName: "Laptop" },
  تەبڵێت: { categoryName: "Electronics", typeName: "Tablet" },
  تەلەڤیزیۆن: { categoryName: "Electronics", typeName: "TV" },
  هێدفۆن: { categoryName: "Electronics", typeName: "Headphones" },
  کامێرا: { categoryName: "Electronics", typeName: "Camera" },
  سپیکەر: { categoryName: "Electronics", typeName: "Speaker" },
  کڵاوە: { categoryName: "Electronics", typeName: "Watch" },
  کیبۆرد: { categoryName: "Electronics", typeName: "Keyboard" },
  میش: { categoryName: "Electronics", typeName: "Mouse" },

  // Clothing in Kurdish
  کراس: { categoryName: "Clothing", typeName: "Shirt" },
  پانتۆڵ: { categoryName: "Clothing", typeName: "Pants" },
  پێڵاو: { categoryName: "Clothing", typeName: "Shoes" },
  جلەبەرگ: { categoryName: "Clothing", typeName: "Dress" },
  جاکێت: { categoryName: "Clothing", typeName: "Jacket" },
  کڵاو: { categoryName: "Clothing", typeName: "Hat" },
  گۆرەو: { categoryName: "Clothing", typeName: "Socks" },
  ژێرجلەبەرگ: { categoryName: "Clothing", typeName: "Underwear" },
  شەڵ: { categoryName: "Clothing", typeName: "Scarf" },
  جانتا: { categoryName: "Clothing", typeName: "Bag" },

  // Food & Beverages in Kurdish
  میوە: { categoryName: "Food & Beverages", typeName: "Fruits" },
  سەوزەوات: { categoryName: "Food & Beverages", typeName: "Vegetables" },
  گۆشت: { categoryName: "Food & Beverages", typeName: "Meat" },
  خواردنەوە: { categoryName: "Food & Beverages", typeName: "Drinks" },
  نەخشە: { categoryName: "Food & Beverages", typeName: "Snacks" },
  شیرەمەنی: { categoryName: "Food & Beverages", typeName: "Dairy" },
  گەنم: { categoryName: "Food & Beverages", typeName: "Grains" },
  بەهارات: { categoryName: "Food & Beverages", typeName: "Spices" },
  کۆنسەرڤ: { categoryName: "Food & Beverages", typeName: "Canned" },
  بەستوو: { categoryName: "Food & Beverages", typeName: "Frozen" },

  // Home & Garden in Kurdish
  کەلوپەل: { categoryName: "Home & Garden", typeName: "Furniture" },
  چێشتخانە: { categoryName: "Home & Garden", typeName: "Kitchen" },
  ئامراز: { categoryName: "Home & Garden", typeName: "Tools" },
  باخچە: { categoryName: "Home & Garden", typeName: "Garden" },
  ڕووناکی: { categoryName: "Home & Garden", typeName: "Lighting" },
  حەمام: { categoryName: "Home & Garden", typeName: "Bathroom" },
  "ژووری نوستن": { categoryName: "Home & Garden", typeName: "Bedroom" },
  "ژووری دانیشتن": { categoryName: "Home & Garden", typeName: "Living Room" },
  "ژووری کار": { categoryName: "Home & Garden", typeName: "Office" },
  دەرەوە: { categoryName: "Home & Garden", typeName: "Outdoor" },
};

async function updateProductsWithCategoryTypes() {
  try {
    await connectDB();

    console.log("Starting to update products with category types...");

    // Get all categories
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories`);

    // Create a map of category names to category objects
    const categoryMap = {};
    categories.forEach((category) => {
      categoryMap[category.name] = category;
    });

    // Get all products that don't have categoryTypeId
    const products = await Product.find({
      $or: [
        { categoryTypeId: { $exists: false } },
        { categoryTypeId: "" },
        { categoryTypeId: null },
      ],
    });

    console.log(
      `Found ${products.length} products that need category type updates`
    );

    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const product of products) {
      try {
        const productType = product.type;
        const mapping = categoryTypeMapping[productType];

        if (!mapping) {
          console.log(
            `No mapping found for product type: "${productType}" (Product: ${product.name})`
          );
          skippedCount++;
          continue;
        }

        const category = categoryMap[mapping.categoryName];
        if (!category) {
          console.log(
            `Category not found: "${mapping.categoryName}" for product type: "${productType}"`
          );
          skippedCount++;
          continue;
        }

        const categoryType = category.types.find(
          (type) => type.name === mapping.typeName
        );
        if (!categoryType) {
          console.log(
            `Category type not found: "${mapping.typeName}" in category: "${mapping.categoryName}"`
          );
          skippedCount++;
          continue;
        }

        // Update the product with categoryTypeId
        await Product.findByIdAndUpdate(product._id, {
          categoryTypeId: categoryType._id.toString(),
        });

        console.log(
          `Updated product "${product.name}" (${productType}) -> Category: ${mapping.categoryName}, Type: ${mapping.typeName}`
        );
        updatedCount++;
      } catch (error) {
        console.error(`Error updating product ${product.name}:`, error.message);
        errors.push(`Product ${product.name}: ${error.message}`);
      }
    }

    console.log("\n=== Update Summary ===");
    console.log(`✅ Successfully updated: ${updatedCount} products`);
    console.log(`⏭️  Skipped (no mapping): ${skippedCount} products`);
    console.log(`❌ Errors: ${errors.length} products`);

    if (errors.length > 0) {
      console.log("\n=== Errors ===");
      errors.forEach((error) => console.log(error));
    }

    // Show some examples of updated products
    const sampleUpdatedProducts = await Product.find({
      categoryTypeId: { $exists: true, $ne: "" },
    })
      .populate("categoryId", "name")
      .limit(5);

    console.log("\n=== Sample Updated Products ===");
    sampleUpdatedProducts.forEach((product) => {
      console.log(
        `- ${product.name} (${product.type}) -> Category: ${product.categoryId?.name}, Type ID: ${product.categoryTypeId}`
      );
    });

    console.log("\n✅ Category type update process completed!");
  } catch (error) {
    console.error("Error in update process:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

updateProductsWithCategoryTypes();
