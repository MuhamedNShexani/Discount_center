const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function testCategoryProduct() {
  try {
    console.log("Testing category product creation...");

    // First, get categories
    const categoriesResponse = await axios.get(`${API_URL}/categories`);
    const categories = categoriesResponse.data;
    console.log(
      "Available categories:",
      categories.map((c) => c.name)
    );

    // Get brands
    const brandsResponse = await axios.get(`${API_URL}/brands`);
    const brands = brandsResponse.data;
    console.log(
      "Available brands:",
      brands.map((b) => b.name)
    );

    // Get stores
    const storesResponse = await axios.get(`${API_URL}/stores`);
    const stores = storesResponse.data;
    console.log(
      "Available stores:",
      stores.map((m) => m.name)
    );

    if (categories.length === 0 || brands.length === 0 || stores.length === 0) {
      console.log("Need at least one category, brand, and store to test");
      return;
    }

    // Create a test product with category
    const testProduct = {
      name: "Test Product with Category",
      type: "Test Type",
      categoryId: categories[0]._id,
      brandId: brands[0]._id,
      storeId: stores[0]._id,
      previousPrice: 10.0,
      newPrice: 8.0,
      isDiscount: true,
      weight: "500g",
      description: "Test product with category",
      barcode: "TEST123",
    };

    console.log("Creating test product:", testProduct);

    const createResponse = await axios.post(`${API_URL}/products`, testProduct);
    console.log("Product created successfully:", createResponse.data);

    // Get the created product to verify category is populated
    const productId = createResponse.data._id;
    const getResponse = await axios.get(`${API_URL}/products/${productId}`);
    console.log("Retrieved product with category:", {
      name: getResponse.data.name,
      category: getResponse.data.categoryId?.name,
      brand: getResponse.data.brandId?.name,
      store: getResponse.data.storeId?.name,
    });

    console.log("✅ Category product test successful!");
  } catch (error) {
    console.error(
      "❌ Error testing category product:",
      error.response?.data || error.message
    );
  }
}

testCategoryProduct();
