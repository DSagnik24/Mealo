import jwt from "jsonwebtoken"
import { config } from "../../config.js"

const genToken=async (userId) => {
    try {
        const token= jwt.sign({userId},config.JWT_SECRET,{expiresIn:"7d"})
        return token
    } catch (error) {
        console.log(error)
    }
}

export default genToken