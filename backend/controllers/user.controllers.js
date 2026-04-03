import { users } from "../utils/mockDb.js";

export const getCurrentUser = async (req, res) => {
    const user = users.find(u => String(u._id) === String(req.userId));
    if(!user) return res.status(400).json({message:"user is not found"});
    return res.status(200).json(user);
};

export const updateUserLocation = async (req, res) => {
    const user = users.find(u => String(u._id) === String(req.userId));
    if (user && req.body.lat && req.body.lon) {
        user.location.coordinates = [req.body.lon, req.body.lat];
    }
    return res.status(200).json({ message: 'location updated' });
};
