const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Test data
const testMarket = {
  name: "Test Market",
  logo: "https://via.placeholder.com/150",
  address: "123 Test Street, Test City",
  phone: "+1-234-567-8900",
};
const testCompany = {
  name: "Test Company",
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
  marketId: "", // Will be filled after market creation
};

const API_URL = process.env.API_URL || "http://localhost:3001/api";

const testAPI = async () => {
  try {
    console.log("🚀 Testing Market API...\n");

    // Test 1: Create Market
    console.log("1. Creating test market...");
    const marketResponse = await axios.post(`${BASE_URL}/markets`, testMarket);
    console.log("✅ Market created:", marketResponse.data.name);
    const marketId = marketResponse.data._id;

    // Test 2: Get All Markets
    console.log("\n2. Getting all markets...");
    const marketsResponse = await axios.get(`${BASE_URL}/markets`);
    console.log("✅ Markets found:", marketsResponse.data.length);

    // Test 3: Get Market by ID
    console.log("\n3. Getting market by ID...");
    const marketByIdResponse = await axios.get(
      `${BASE_URL}/markets/${marketId}`
    );
    console.log("✅ Market retrieved:", marketByIdResponse.data.name);

    // Prepare test product
    testProduct.companyId = marketId;

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

    // Test 6: Get Products by Market
    console.log("\n6. Getting products by market...");
    const productsByMarketResponse = await axios.get(
      `${BASE_URL}/products/company/${marketId}`
    );
    console.log(
      "✅ Products by market found:",
      productsByMarketResponse.data.length
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
