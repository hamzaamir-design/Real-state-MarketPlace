import { v2 as cloudinary } from "cloudinary";
import express from "express";

const router = express.Router();
console.log("🔍 ENV CHECK:", {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  API_KEY: process.env.CLOUDINARY_API_KEY,
  API_SECRET: process.env.CLOUDINARY_API_SECRET ? "Loaded ✅" : "Missing ❌"
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DELETE /api/cloudinary/delete
router.delete("/delete", async (req, res) => {
  try {
    const { public_id } = req.body;

    console.log("🧾 Incoming delete request for:", public_id);

    if (!public_id) {
      return res.status(400).json({ success: false, message: "Missing public_id" });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    console.log("☁️ Cloudinary result:", result);

    if (result.result === "ok") {
      return res.status(200).json({ success: true, message: "Image deleted successfully" });
    } else {
      return res.status(400).json({
        success: false,
        message: `Cloudinary deletion failed: ${result.result}`,
      });
    }
  } catch (err) {
    console.error("🔥 Cloudinary delete error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error deleting image",
      error: err.message,
    });
  }
});

export default router;
