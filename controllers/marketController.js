const Market = require("../models/Market");
const Product = require("../models/Product");

// @desc    Get all markets
// @route   GET /api/markets
const getMarkets = async (req, res) => {
  try {
    const markets = await Market.find();
    res.json(markets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get market by ID
// @route   GET /api/markets/:id
const getMarketById = async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).json({ msg: "Market not found" });
    res.json(market);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Create market
// @route   POST /api/markets
const createMarket = async (req, res) => {
  try {
    const market = new Market(req.body);
    await market.save();
    res.json(market);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Update market
// @route   PUT /api/markets/:id
const updateMarket = async (req, res) => {
  try {
    const market = await Market.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!market) return res.status(404).json({ msg: "Market not found" });
    res.json(market);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Delete market
// @route   DELETE /api/markets/:id
const deleteMarket = async (req, res) => {
  try {
    const marketId = req.params.id;

    // Check if there are any products associated with this market
    const productCount = await Product.countDocuments({ marketId: marketId });

    if (productCount > 0) {
      return res.status(400).json({
        msg: "Cannot delete market. It has associated products. Please delete the products first.",
      });
    }

    const market = await Market.findByIdAndDelete(marketId);
    if (!market) return res.status(404).json({ msg: "Market not found" });

    res.json({ msg: "Market deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getMarkets,
  getMarketById,
  createMarket,
  updateMarket,
  deleteMarket,
};
