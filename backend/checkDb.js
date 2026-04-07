import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
mongoose.connect(process.env.MONGODB_URL).then(async () => {
    const Shop = mongoose.model("Shop", new mongoose.Schema({}, {strict: false}));
    const shops = await Shop.find({});
    console.log("Total Shops:", shops.length);
    console.log("Shops:", shops);
    process.exit(0);
});
