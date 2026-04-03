import { shops } from "../utils/mockDb.js";

export const createEditShop = async (req, res) => {
    let shop = shops.find(s => String(s.owner._id) === String(req.userId));
    if (!shop) {
        shop = { _id: "shop_" + Date.now(), ...req.body, owner: { _id: req.userId }, items: [] };
        shops.push(shop);
    } else {
        Object.assign(shop, req.body);
    }
    return res.status(201).json(shop);
};

export const getMyShop = async (req, res) => {
    const shop = shops.find(s => String(s.owner._id) === String(req.userId));
    if(!shop) return res.status(200).json(null);
    return res.status(200).json(shop);
};

export const getShopByCity = async (req, res) => res.status(200).json(shops);