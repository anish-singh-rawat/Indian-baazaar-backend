import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js"; 
import dotenv from 'dotenv';
dotenv.config();

export default async function adminAuth(req, res, next) {
  try {
    let token = req.headers?.authorization?.split(" ")[1];
    if (!token) token = req.query.token;

    if (!token) {
      return res.status(401).json({
        message: "Access token is required",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

    if (!decoded?.id) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (user.role !== "RETAILER" && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Permission denied",
        success: false,
      });
    }

    req.userId = user._id;
    req.user = user;

    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);
    return res.status(401).json({
      message: "Invalid or expired token",
      success: false,
      error: error.message,
    });
  }
};

export async function superAdminAuth(req, res, next) {
  try {
    let token = req.headers?.authorization?.split(" ")[1];
    if (!token) token = req.query.token;

    if (!token) {
      return res.status(401).json({
        message: "Access token is required",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

    if (!decoded?.id) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Permission denied. Super Admins only.",
        success: false,
      });
    }

    req.userId = user._id;
    req.user = user;

    next();
  } catch (error) {
    console.error("Super Admin Auth Error:", error);
    return res.status(401).json({
      message: "Invalid or expired token",
      success: false,
      error: error.message,
    });
  }
}

