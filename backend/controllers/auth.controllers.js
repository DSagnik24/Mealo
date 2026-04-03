import genToken from "../utils/token.js";
import { users } from "../utils/mockDb.js";

export const signUp = async (req, res) => {
    const {fullName, email, password, mobile, role} = req.body;
    let user = users.find(u => u.email === email);
    if(user) return res.status(400).json({message: "User Already exist."});
    
    user = {
      _id: "user_" + Date.now(),
      fullName, email, mobile, role,
      location: { type: "Point", coordinates: [77.2090, 28.6139] }
    };
    users.push(user);
    const token = await genToken(user._id);
    res.cookie("token", token, { secure: false, sameSite: "strict", maxAge: 7*24*60*60*1000, httpOnly: true });
    return res.status(201).json(user);
};

export const signIn = async (req, res) => {
    const {email, password} = req.body;
    const user = users.find(u => u.email === email);
    if(!user) return res.status(400).json({message: "User does not exist."});
    
    const token = await genToken(user._id);
    res.cookie("token", token, { secure: false, sameSite: "strict", maxAge: 7*24*60*60*1000, httpOnly: true });
    return res.status(200).json(user);
};

export const signOut = async (req, res) => {
    res.clearCookie("token");
    return res.status(200).json({ message: "log out successfully" });
};

export const sendOtp = async (req, res) => res.status(200).json({ message: "otp sent successfully" });
export const verifyOtp = async (req, res) => res.status(200).json({ message: "otp verify successfully" });
export const resetPassword = async (req, res) => res.status(200).json({ message: "password reset successfully" });
export const googleAuth = async (req, res) => {
    let user = users.find(u => u.email === req.body.email);
    if (!user) {
        user = {
          _id: "user_" + Date.now(),
          fullName: req.body.fullName, email: req.body.email, mobile: req.body.mobile, role: req.body.role,
          location: { type: "Point", coordinates: [77.2090, 28.6139] }
        };
        users.push(user);
    }
    const token = await genToken(user._id);
    res.cookie("token", token, { secure: false, sameSite: "strict", maxAge: 7*24*60*60*1000, httpOnly: true });
    return res.status(200).json(user);
};