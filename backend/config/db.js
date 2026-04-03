import mongoose from "mongoose"
import { config } from "../../config.js"

const connectDb=async () => {
    try {
        await mongoose.connect(config.MONGODB_URL)
        console.log("db connected")
    } catch (error) {
        console.log("db error", error.message)
    }
}

export default connectDb