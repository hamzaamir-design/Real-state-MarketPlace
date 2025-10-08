import React, { useState } from "react";
import { useSelector } from "react-redux";
import {useNavigate} from "react-router-dom";

export default function CreateListing() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "rent",
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 0,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });

  const { currentUser } = useSelector((state) => state.user);

  // 🧠 Handle input change
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (id === "sale" || id === "rent") {
      setFormData((prev) => ({
        ...prev,
        type: id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // ☁️ Upload image to Cloudinary
  const storeImage = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const json = await res.json();
    if (!res.ok) {
      console.error("Cloudinary Upload Error:", json);
      throw new Error("Upload failed");
    }
    return json.secure_url;
  };

  // 🖼️ Upload selected images
  const handleImageSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0)
      return setMessage("⚠️ Please select at least one image.");
    if (files.length + formData.imageUrls.length > 7)
      return setMessage("⚠️ You can upload a maximum of 7 images.");

    setUploading(true);
    setMessage("⏳ Uploading images...");

    try {
      const urls = await Promise.all(files.map((f) => storeImage(f)));
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...urls],
      }));
      setMessage("✅ All images uploaded successfully!");
      setFiles([]);
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("❌ Image upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // 🗑️ Delete image locally
  const handleDeleteImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
    setMessage("🗑️ Image removed.");
  };

  // 🏠 Submit listing to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?._id) return setMessage("⚠️ Please log in first.");
    if (formData.imageUrls.length === 0)
      return setMessage("⚠️ Please upload at least one image.");
    if (+formData.discountPrice >= +formData.regularPrice)
      return setMessage("⚠️ Discount must be less than regular price.");

    setLoading(true);

    try {
      const res = await fetch("/api/listing/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create listing");

      setMessage("✅ Listing created successfully!");
      console.log("📦 Created listing:", data);
      console.log(formData);

      // Reset form
      setFormData({
        imageUrls: [],
        name: "",
        description: "",
        address: "",
        type: "rent",
        bedrooms: 1,
        bathrooms: 1,
        regularPrice: 0,
        discountPrice: 0,
        offer: false,
        parking: false,
        furnished: false,
      });
      navigate(`/listing/${data.data._id}`);
    } catch (err) {
      console.error("❌ Error creating listing:", err);
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-3xl font-bold text-center my-7 text-gray-800">
        Create Listing
      </h1>

      <form className="flex flex-col sm:flex-row gap-6" onSubmit={handleSubmit}>
        {/* Left Section */}
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            placeholder="Title"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="border p-3 rounded-lg"
            required
          />

          <textarea
            placeholder="Description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            className="border p-3 rounded-lg"
            required
          />

          <input
            type="text"
            placeholder="Address"
            id="address"
            value={formData.address}
            onChange={handleChange}
            className="border p-3 rounded-lg"
            required
          />

          {/* Type */}
          <div className="flex gap-6">
            <label className="flex gap-2 items-center">
              <input
                type="radio"
                name="type"
                id="sale"
                checked={formData.type === "sale"}
                onChange={handleChange}
              />
              Sell
            </label>
            <label className="flex gap-2 items-center">
              <input
                type="radio"
                name="type"
                id="rent"
                checked={formData.type === "rent"}
                onChange={handleChange}
              />
              Rent
            </label>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-5">
            {["parking", "furnished", "offer"].map((key) => (
              <label key={key} className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={formData[key]}
                  onChange={handleChange}
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>

          {/* Numbers */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className="border p-2 w-20 rounded"
                min="1"
                max="10"
              />
              <span>Beds</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                className="border p-2 w-20 rounded"
                min="1"
                max="10"
              />
              <span>Baths</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="regularPrice"
                value={formData.regularPrice}
                onChange={handleChange}
                className="border p-2 w-24 rounded"
              />
              <span>Regular Price ($)</span>
            </div>
            {formData.offer && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  className="border p-2 w-24 rounded"
                />
                <span>Discounted ($)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold text-gray-700">
            Images
            <span className="font-normal text-gray-500 ml-2">
              (Max 7 - first is cover)
            </span>
          </p>

          <div className="flex gap-3">
            <input
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="p-3 border rounded w-full"
              type="file"
              id="images"
              accept="image/*"
              multiple
            />
            <button
              onClick={handleImageSubmit}
              type="button"
              disabled={uploading}
              className="p-3 px-5 text-green-700 border border-green-700 rounded-md uppercase hover:bg-green-50 transition disabled:opacity-70"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {message && (
            <p
              className={`text-sm text-center font-medium ${
                message.includes("❌") || message.includes("⚠️")
                  ? "text-red-600"
                  : "text-green-700"
              }`}
            >
              {message}
            </p>
          )}

          {formData.imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {formData.imageUrls.map((url, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={url}
                    alt={`upload-${idx}`}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded hover:opacity-80"
                  >
                    ✕
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-2 py-1">
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || loading}
            className={`p-3 rounded-lg uppercase transition mt-3 ${
              uploading || loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-700 hover:bg-slate-800 text-white"
            }`}
          >
            {loading
              ? "Creating..."
              : uploading
              ? "Uploading..."
              : "Create Listing"}
          </button>
        </div>
      </form>
    </main>
  );
}
