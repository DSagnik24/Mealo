import { items, shops } from "../utils/mockDb.js";

export const addItem = async (req, res) => {
    const newItem = {
      _id: "item_" + Date.now(),
      ...req.body,
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80",
      rating: { count: 0, average: 0 },
      shop: { _id: shops[0]._id, name: shops[0].name }
    };
    items.push(newItem);
    shops[0].items.push(newItem);
    return res.status(201).json(shops[0]);
};

export const editItem = async (req, res) => res.status(200).json(items[0]);
export const getItemById = async (req, res) => res.status(200).json(items.find(i => i._id === req.params.itemId) || items[0]);
export const deleteItem = async (req, res) => res.status(200).json({});
export const getItemByCity = async (req, res) => res.status(200).json(items);
export const getItemsByShop = async (req, res) => res.status(200).json({ shop: shops[0], items: shops[0].items });
export const searchItems = async (req, res) => res.status(200).json(items);
export const rating = async (req, res) => res.status(200).json({ rating: { count: 1, average: 5 } });