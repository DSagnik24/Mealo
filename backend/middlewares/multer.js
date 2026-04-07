import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publicPath = path.join(__dirname, "../public")

const storage=multer.diskStorage({
   destination:(req,file,cb)=>{
    cb(null,publicPath)
   },
   filename:(req,file,cb)=>{
    cb(null, Date.now() + "-" + file.originalname)
   }
})

export const upload=multer({storage})