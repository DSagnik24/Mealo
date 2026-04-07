import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price, shopId } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
            if (!image) {
                return res.status(500).json({ message: "Cloudinary upload failed." })
            }
        }
        
        if (!shopId) return res.status(400).json({ message: "shopId is required" })
        
        const shop = await Shop.findOne({ _id: shopId, owner: req.userId })
        if (!shop) {
            return res.status(400).json({ message: "shop not found" })
        }
        
        if (!image) {
            return res.status(400).json({ message: "Food image is required." })
        }
        
        const item = await Item.create({
            name, category, foodType, price, image, shop: shop._id
        })

        shop.items.push(item._id)
        await shop.save()
        
        const allShops = await Shop.find({owner: req.userId}).populate("owner").populate({
            path:"items",
            options:{sort:{updatedAt:-1}}
        })
        return res.status(201).json(allShops)

    } catch (error) {
        return res.status(500).json({ message: `add item error ${error}` })
    }
}

export const editItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const { name, category, foodType, price, shopId } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }
        
        if (!shopId) return res.status(400).json({ message: "shopId is required" })
        const shop = await Shop.findOne({ _id: shopId, owner: req.userId }).populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        if (!shop) return res.status(400).json({ message: "Shop not found" })

        const item = await Item.findByIdAndUpdate(itemId, {
            name, category, foodType, price, image
        }, { new: true })
        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        
        const allShops = await Shop.find({owner: req.userId}).populate("owner").populate({
            path:"items",
            options:{sort:{updatedAt:-1}}
        })
        return res.status(200).json(allShops)

    } catch (error) {
        return res.status(500).json({ message: `edit item error ${error}` })
    }
}

export const getItemById = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findById(itemId)
        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        return res.status(200).json(item)
    } catch (error) {
        return res.status(500).json({ message: `get item error ${error}` })
    }
}

export const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findByIdAndDelete(itemId)
        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        const shop = await Shop.findOne({ _id: item.shop, owner: req.userId })
        if (shop) {
            shop.items = shop.items.filter(i => String(i) !== String(item._id))
            await shop.save()
        }
        
        const allShops = await Shop.find({owner: req.userId}).populate("owner").populate({
            path:"items",
            options:{sort:{updatedAt:-1}}
        })
        return res.status(200).json(allShops)

    } catch (error) {
        return res.status(500).json({ message: `delete item error ${error}` })
    }
}

export const getItemByCity = async (req, res) => {
    try {
        const { city } = req.params
        if (!city) {
            return res.status(400).json({ message: "city is required" })
        }
        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") }
        }).populate('items')
        if (!shops) {
            return res.status(400).json({ message: "shops not found" })
        }
        const shopIds=shops.map((shop)=>shop._id)

        const items=await Item.find({shop:{$in:shopIds}})
        return res.status(200).json(items)

    } catch (error) {
 return res.status(500).json({ message: `get item by city error ${error}` })
    }
}

export const getNearbyItems = async (req, res) => {
    try {
        const { lat, lon } = req.query
        if (!lat || !lon) {
            return res.status(400).json({ message: "lat and lon query params are required" })
        }
        const maxDistanceMeters = 200 * 1000

        const nearbyShops = await Shop.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [Number(lon), Number(lat)] },
                    $maxDistance: maxDistanceMeters
                }
            }
        })
        const shopIds = nearbyShops.map(s => s._id)
        const items = await Item.find({ shop: { $in: shopIds } }).populate("shop", "name image")
        return res.status(200).json(items)
    } catch (error) {
        return res.status(500).json({ message: `get nearby items error ${error}` })
    }
}

export const getItemsByShop=async (req,res) => {
    try {
        const {shopId}=req.params
        const shop=await Shop.findById(shopId).populate("items")
        if(!shop){
            return res.status(400).json("shop not found")
        }
        return res.status(200).json({
            shop,items:shop.items
        })
    } catch (error) {
         return res.status(500).json({ message: `get item by shop error ${error}` })
    }
}

export const searchItems=async (req,res) => {
    try {
        const {query,city}=req.query
        if(!query || !city){
            return null
        }
        const shops=await Shop.find({
            city:{$regex:new RegExp(`^${city}$`, "i")}
        }).populate('items')
        if(!shops){
            return res.status(400).json({message:"shops not found"})
        }
        const shopIds=shops.map(s=>s._id)
        const items=await Item.find({
            shop:{$in:shopIds},
            $or:[
              {name:{$regex:query,$options:"i"}},
              {category:{$regex:query,$options:"i"}}  
            ]

        }).populate("shop","name image")

        return res.status(200).json(items)

    } catch (error) {
         return res.status(500).json({ message: `search item  error ${error}` })
    }
}


export const rating=async (req,res) => {
    try {
        const {itemId,rating}=req.body

        if(!itemId || !rating){
            return res.status(400).json({message:"itemId and rating is required"})
        }

        if(rating<1 || rating>5){
             return res.status(400).json({message:"rating must be between 1 to 5"})
        }

        const item=await Item.findById(itemId)
        if(!item){
              return res.status(400).json({message:"item not found"})
        }

        const newCount=item.rating.count + 1
        const newAverage=(item.rating.average*item.rating.count + rating)/newCount

        item.rating.count=newCount
        item.rating.average=newAverage
        await item.save()
return res.status(200).json({rating:item.rating})

    } catch (error) {
         return res.status(500).json({ message: `rating error ${error}` })
    }
}