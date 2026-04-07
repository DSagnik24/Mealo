import mongoose from "mongoose"

const connectDb=async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL

        if (!mongoUrl || mongoUrl.includes("Add your mongodb url")) {
            throw new Error("MONGODB_URL is missing or still a placeholder in backend/.env")
        }

        await mongoose.connect(mongoUrl)
        console.log("db connected")
    } catch (error) {
        console.error("db connection failed:", error.message)
        throw error
    }
}

export default connectDb