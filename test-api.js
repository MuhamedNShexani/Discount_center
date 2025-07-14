const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Test data
const testCompany = {
  name: "Test Market",
  logo: "https://via.placeholder.com/150",
  address: "123 Test Street",
  phone: "+1234567890",
  description: "A test market for demonstration",
};

const testProduct = {
  name: "Test Product",
  type: "Electronics",
  image: "https://via.placeholder.com/300",
  previousPrice: 100,
  newPrice: 80,
  companyId: "", // Will be filled after company creation
  expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
};

async function testAPI() {
  try {
    console.log("🚀 Testing Market API...\n");

    // Test 1: Create Company
    console.log("1. Creating test company...");
    const companyResponse = await axios.post(
      `${BASE_URL}/companies`,
      testCompany
    );
    console.log("✅ Company created:", companyResponse.data.name);
    const companyId = companyResponse.data._id;

    // Test 2: Get All Companies
    console.log("\n2. Getting all companies...");
    const companiesResponse = await axios.get(`${BASE_URL}/companies`);
    console.log("✅ Companies found:", companiesResponse.data.length);

    // Test 3: Get Company by ID
    console.log("\n3. Getting company by ID...");
    const companyByIdResponse = await axios.get(
      `${BASE_URL}/companies/${companyId}`
    );
    console.log("✅ Company retrieved:", companyByIdResponse.data.name);

    // Test 4: Create Product
    console.log("\n4. Creating test product...");
    testProduct.companyId = companyId;
    const productResponse = await axios.post(
      `${BASE_URL}/products`,
      testProduct
    );
    console.log("✅ Product created:", productResponse.data.name);

    // Test 5: Get All Products
    console.log("\n5. Getting all products...");
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    console.log("✅ Products found:", productsResponse.data.length);

    // Test 6: Get Products by Company
    console.log("\n6. Getting products by company...");
    const productsByCompanyResponse = await axios.get(
      `${BASE_URL}/products/company/${companyId}`
    );
    console.log(
      "✅ Products by company found:",
      productsByCompanyResponse.data.length
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
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
