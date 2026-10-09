const demoRestaurants = require("../data/demoRestaurants");
module.exports = { demos: (_req, res) => res.json({ restaurants: demoRestaurants }) };
