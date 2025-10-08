import { useState } from "react";

export default function CreateListing() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [message, setMessage] = useState("");

  // ✅ Cloudinary upload
  const storeImage = async (file) => {
    const cloudName = "djhjrkgfv";
    const uploadPreset = "first_time_using_cloudinary";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("cloud_name", cloudName);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.secure_url && data.public_id) {
      return { url: data.secure_url, public_id: data.public_id };
    } else {
      throw new Error("Upload failed");
    }
  };

  // ✅ Upload handler
  const handleImageSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) return setMessage("⚠️ Please select at least one image.");

    if (files.length + imageUrls.length > 7) {
      return setMessage("⚠️ You can upload a maximum of 7 images in total.");
    }

    setUploading(true);
    setMessage("⏳ Uploading images...");
    try {
      const uploads = await Promise.all(files.map((f) => storeImage(f)));
      setImageUrls((prev) => [...prev, ...uploads]);
      setMessage("✅ All images uploaded successfully!");
      setFiles([]);
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("❌ Image upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // 🗑️ Delete handler (Cloudinary + UI)
  const handleDeleteImage = async (public_id) => {
    try {
      console.log("Deleting image:", public_id);
      const res = await fetch("/api/cloudinary/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id }),
      });

      if (!res.ok) {
        const text = await res.text(); // fallback to raw text
        throw new Error(`Delete failed: ${res.status} - ${text}`);
      }

      const data = await res.json();

      if (data.success) {
        setImageUrls((prev) => prev.filter((img) => img.public_id !== public_id));
        setMessage("🗑️ Image deleted successfully!");
      } else {
        setMessage("❌ Failed to delete image from Cloudinary.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("❌ Something went wrong deleting the image.");
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-3xl font-bold text-center my-7 text-gray-800">
        Create Listing
      </h1>

      <form className="flex flex-col sm:flex-row gap-6">
        {/* Left Section */}
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            placeholder="Name"
            className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
            id="name"
            maxLength="62"
            minLength="10"
            required
          />

          <textarea
            placeholder="Description"
            className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
            id="description"
            required
          />

          <input
            type="text"
            placeholder="Address"
            className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
            id="address"
            required
          />

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-5">
            {[
              { id: "sale", label: "Sell" },
              { id: "rent", label: "Rent" },
              { id: "parking", label: "Parking Spot" },
              { id: "furnished", label: "Furnished" },
              { id: "offer", label: "Offer" },
            ].map((item) => (
              <div key={item.id} className="flex gap-2 items-center">
                <input type="checkbox" id={item.id} className="w-5" />
                <label htmlFor={item.id}>{item.label}</label>
              </div>
            ))}
          </div>

          {/* Numeric Inputs */}
          <div className="flex flex-wrap gap-6">
            {[
              { id: "bedrooms", label: "Beds", max: 10, width: "w-20" },
              { id: "bathrooms", label: "Baths", max: 10, width: "w-20" },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="number"
                  id={item.id}
                  min="1"
                  max={item.max}
                  required
                  className={`p-3 border border-gray-300 rounded-lg ${item.width}`}
                />
                <p>{item.label}</p>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="number"
                id="regularPrice"
                min="1"
                required
                className="p-3 border border-gray-300 rounded-lg w-28"
              />
              <div className="flex flex-col items-center">
                <p>Regular Price</p>
                <span className="text-sm text-gray-500">($ / month)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                id="discountPrice"
                min="1"
                required
                className="p-3 border border-gray-300 rounded-lg w-28"
              />
              <div className="flex flex-col items-center">
                <p>Discounted Price</p>
                <span className="text-sm text-gray-500">($ / month)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold text-gray-700">
            Images
            <span className="font-normal text-gray-500 ml-2">
              The first image will be the cover (max 7)
            </span>
          </p>

          <div className="flex gap-3">
            <input
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="p-3 border border-gray-300 rounded w-full"
              type="file"
              id="images"
              accept="image/*"
              multiple
            />
            <button
              onClick={handleImageSubmit}
              type="button"
              disabled={uploading}
              className="p-3 px-5 text-green-700 border border-green-700 rounded-md uppercase hover:bg-green-50 hover:shadow transition disabled:opacity-70"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {message && (
            <p
              className={`text-sm text-center font-medium ${message.includes("❌") || message.includes("⚠️")
                  ? "text-red-600"
                  : "text-green-700"
                }`}
            >
              {message}
            </p>
          )}

          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imageUrls.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img.url}
                    alt="uploaded"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.public_id)}
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
            className="p-3 bg-slate-700 text-white rounded-lg uppercase hover:bg-slate-800 transition mt-3"
          >
            Create Listing
          </button>
        </div>
      </form>
    </main>
  );
}
