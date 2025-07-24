const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function testCategoryTypeProduct() {
  try {
    console.log("Testing category type product creation...");

    // First, get categories
    const categoriesResponse = await axios.get(`${API_URL}/categories`);
    const categories = categoriesResponse.data;
    console.log(
      "Available categories:",
      categories.map((c) => c.name)
    );

    if (categories.length === 0) {
      console.log("No categories available");
      return;
    }

    // Get the first category and its types
    const category = categories[0];
    console.log("Selected category:", category.name);
    console.log(
      "Category types:",
      category.types.map((t) => ({ name: t.name, id: t._id }))
    );

    if (category.types.length === 0) {
      console.log("No types available in this category");
      return;
    }

    // Get brands
    const brandsResponse = await axios.get(`${API_URL}/brands`);
    const brands = brandsResponse.data;

    // Get markets
    const marketsResponse = await axios.get(`${API_URL}/markets`);
    const markets = marketsResponse.data;

    if (brands.length === 0 || markets.length === 0) {
      console.log("Need at least one brand and market to test");
      return;
    }

    // Create a test product with category and category type
    const testProduct = {
      name: "Test Product with Category Type",
      type: category.types[0].name,
      categoryId: category._id,
      categoryTypeId: category.types[0]._id,
      brandId: brands[0]._id,
      marketId: markets[0]._id,
      previousPrice: 15.0,
      newPrice: 12.0,
      isDiscount: true,
      weight: "750g",
      description: "Test product with category type",
      barcode: "TEST456",
    };

    console.log(
      "Creating test product with data:",
      JSON.stringify(testProduct, null, 2)
    );

    const createResponse = await axios.post(`${API_URL}/products`, testProduct);
    console.log("Product created successfully:", createResponse.data);

    // Get the created product to verify category and type are populated
    const productId = createResponse.data._id;
    const getResponse = await axios.get(`${API_URL}/products/${productId}`);
    console.log("Retrieved product with category and type:", {
      name: getResponse.data.name,
      category: getResponse.data.categoryId?.name,
      categoryTypeId: getResponse.data.categoryTypeId,
      brand: getResponse.data.brandId?.name,
      market: getResponse.data.marketId?.name,
    });

    console.log("✅ Category type product test successful!");
  } catch (error) {
    console.error(
      "❌ Error testing category type product:",
      error.response?.data || error.message
    );
  }
}

testCategoryTypeProduct();
