const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Food = require("../models/FoodData");
const foods = require("../data/sampleFoods");

async function seed() {
  try {
    if (!process.env.URI) throw new Error("URI is required");
    for (const food of foods) await new Food(food).validate();
    await mongoose.connect(process.env.URI, { serverSelectionTimeoutMS: 15000 });
    const result = await Food.bulkWrite(foods.map(food => ({
      updateOne: {
        filter: { name: food.name },
        update: { $setOnInsert: food },
        upsert: true,
      },
    })));
    console.log(JSON.stringify({
      database: mongoose.connection.name,
      inserted: result.upsertedCount,
      skipped: result.matchedCount,
      total: await Food.countDocuments(),
    }));
  } catch (error) {
    console.error(`Product import failed (${error.name}). Check database access and configuration.`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
seed();
