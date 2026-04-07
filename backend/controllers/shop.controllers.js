import Shop from "../models/shop.model.js";
import Item from "../models/item.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const createEditShop=async (req,res) => {
    try {
       const {name,city,state,address, shopId, latitude, longitude}=req.body
       let image;
       if(req.file){
        image=await uploadOnCloudinary(req.file.path)
        if (!image) {
            return res.status(500).json({message: "Cloudinary upload failed."})
        }
       } 
       let shop;
       if (shopId && shopId !== "undefined" && shopId !== "null") {
          shop=await Shop.findOne({_id: shopId, owner:req.userId})
       }

       const locationObj = (latitude && longitude) ? {
           type: "Point",
           coordinates: [Number(longitude), Number(latitude)]
       } : undefined

       if(!shop){
        if (!image) return res.status(400).json({message: "Shop image is required."})
        const createPayload = { name,city,state,address,image,owner:req.userId }
        if (locationObj) createPayload.location = locationObj
        shop=await Shop.create(createPayload)
       }else{
         const updatePayload = { name,city,state,address,owner:req.userId }
         if (image) updatePayload.image = image;
         if (locationObj) updatePayload.location = locationObj
         shop=await Shop.findByIdAndUpdate(shop._id, updatePayload, {new:true})
       }
      
       const allShops = await Shop.find({owner: req.userId}).populate("owner").populate({
            path:"items",
            options:{sort:{updatedAt:-1}}
        })
       return res.status(201).json(allShops)
    } catch (error) {
        console.error("createEditShop error:", error);
        return res.status(500).json({message:`create shop error ${error.message || error}`})
    }
}

export const getMyShop=async (req,res) => {
    try {
        const shops=await Shop.find({owner:req.userId}).populate("owner").populate({
            path:"items",
            options:{sort:{updatedAt:-1}}
        })
        if(!shops){
            return res.status(400).json([])
        }
        return res.status(200).json(shops)
    } catch (error) {
        return res.status(500).json({message:`get my shop error ${error}`})
    }
}

export const getShopByCity=async (req,res) => {
    try {
        const {city}=req.params

        const shops=await Shop.find({
            city:{$regex:new RegExp(`^${city}$`, "i")}
        }).populate('items')
        if(!shops){
            return res.status(400).json({message:"shops not found"})
        }
        return res.status(200).json(shops)
    } catch (error) {
        return res.status(500).json({message:`get shop by city error ${error}`})
    }
}

export const getNearbyShops = async (req, res) => {
    try {
        const { lat, lon } = req.query
        if (!lat || !lon) {
            return res.status(400).json({ message: "lat and lon query params are required" })
        }

        const latitude = Number(lat)
        const longitude = Number(lon)
        const maxDistanceMeters = 200 * 1000 // 200km

        const shops = await Shop.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [longitude, latitude] },
                    distanceField: "distance",
                    maxDistance: maxDistanceMeters,
                    spherical: true
                }
            },
            {
                $lookup: {
                    from: "items",
                    localField: "items",
                    foreignField: "_id",
                    as: "items"
                }
            },
            {
                $addFields: {
                    distanceKm: { $round: [{ $divide: ["$distance", 1000] }, 1] }
                }
            },
            {
                $sort: { distance: 1 }
            }
        ])

        return res.status(200).json(shops)
    } catch (error) {
        return res.status(500).json({ message: `get nearby shops error ${error}` })
    }
}

export const deleteShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await Shop.findOne({ _id: shopId, owner: req.userId });
        if (!shop) {
            return res.status(404).json({ message: "Shop not found or unauthorized" });
        }

        // Delete associated items to maintain data integrity.
        await Item.deleteMany({ shop: shopId });

        await Shop.findByIdAndDelete(shopId);

        const allShops = await Shop.find({ owner: req.userId }).populate("owner").populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        });
        return res.status(200).json(allShops);
    } catch (error) {
        console.error("deleteShop error:", error);
        return res.status(500).json({ message: `delete shop error ${error.message || error}` });
    }
}