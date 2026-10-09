const mongoose = require("mongoose");
module.exports = () => mongoose.connect(process.env.URI, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
