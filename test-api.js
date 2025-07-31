const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Test data
const testStore = {
  name: "Test Store",
  logo: "https://via.placeholder.com/150",
  address: "123 Test Street, Test City",
  phone: "+1-234-567-8900",
};
const testBrand = {
  name: "Test Brand",
  logo: "https://via.placeholder.com/150",
  address: "123 Test Street, Test City",
  phone: "+1-234-567-8900",
};

const testProduct = {
  name: "Test Product",
  type: "Health & Beauty",
  image: "https://via.placeholder.com/300x200",
  previousPrice: 25.99,
  newPrice: 19.99,
  expireDate: "2024-12-31",
  storeId: "", // Will be filled after store creation
};

const API_URL = process.env.API_URL || "http://localhost:3001/api";

const testAPI = async () => {
  try {
    console.log("🚀 Testing Store API...\n");

    // Test 1: Create Store
    console.log("1. Creating test store...");
    const storeResponse = await axios.post(`${BASE_URL}/stores`, testStore);
    console.log("✅ Store created:", storeResponse.data.name);
    const storeId = storeResponse.data._id;

    // Test 2: Get All Stores
    console.log("\n2. Getting all stores...");
    const storesResponse = await axios.get(`${BASE_URL}/stores`);
    console.log("✅ Stores found:", storesResponse.data.length);

    // Test 3: Get Store by ID
    console.log("\n3. Getting store by ID...");
    const storeByIdResponse = await axios.get(`${BASE_URL}/stores/${storeId}`);
    console.log("✅ Store retrieved:", storeByIdResponse.data.name);

    // Prepare test product
    testProduct.brandId = storeId;

    // Test 4: Create Product
    console.log("\n4. Creating test product...");
    const productResponse = await axios.post(
      `${BASE_URL}/products`,
      testProduct
    );
    console.log("✅ Product created:", productResponse.data.name);

    // Test 5: Get All Products
    console.log("\n5. Getting all products...");
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    console.log("✅ Products found:", productsResponse.data.length);

    // Test 6: Get Products by Store
    console.log("\n6. Getting products by store...");
    const productsByStoreResponse = await axios.get(
      `${BASE_URL}/products/brand/${storeId}`
    );
    console.log(
      "✅ Products by store found:",
      productsByStoreResponse.data.length
    );

    // Test 7: Get Categories
    console.log("\n7. Getting categories...");
    const categoriesResponse = await axios.get(
      `${BASE_URL}/products/categories`
    );
    console.log("✅ Categories found:", categoriesResponse.data);

    console.log("\n🎉 All tests passed! API is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
