import { useSelector, useDispatch } from "react-redux";
import { useRef, useState } from "react";
import { updateUserSuccess } from "../redux/user/userSlice";

export default function Profile() {
  const fileRef = useRef(null);
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  const [file, setFile] = useState(undefined);
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const [formData, setFormData] = useState({
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // 🔹 Handle image upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    setLoading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "first_time_using_cloudinary");
    data.append("cloud_name", "djhjrkgfv");

    try {
      // 1️⃣ Upload to Cloudinary
      const cloudinaryRes = await fetch(
        "https://api.cloudinary.com/v1_1/djhjrkgfv/image/upload",
        {
          method: "POST",
          body: data,
        }
      );

      if (!cloudinaryRes.ok) {
        const errorText = await cloudinaryRes.text();
        throw new Error(`Cloudinary Error: ${errorText}`);
      }

      const uploadResult = await cloudinaryRes.json();
      if (!uploadResult.url) throw new Error("Image URL not returned from Cloudinary");

      const newAvatarUrl = uploadResult.url;
      setAvatar(newAvatarUrl);

      // 2️⃣ Update backend
      const backendRes = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: newAvatarUrl }),
      });

      const updatedUser = await backendRes.json();
      if (!backendRes.ok) {
        throw new Error(updatedUser.message || "Failed to update user in backend.");
      }

      // 3️⃣ Redux update
      dispatch(updateUserSuccess(updatedUser));
      setUploadSuccess(true);
      setUploadError(null);
    } catch (err) {
      console.error("❌ Upload or update failed:", err);
      setUploadError(err.message || "Something went wrong while uploading.");
      setUploadSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle text input
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  // 🔹 Handle profile update (username, email, etc.)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatar }),
      });

      const updatedUser = await res.json();
      if (!res.ok) throw new Error(updatedUser.message || "Update failed");

      dispatch(updateUserSuccess(updatedUser));
      setUpdateSuccess(true);
      setUpdateError(null);
    } catch (err) {
      console.error("❌ Update failed:", err);
      setUpdateError(err.message || "Profile update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          onChange={handleFileUpload}
          type="file"
          ref={fileRef}
          hidden
          accept="image/*"
        />

        <img
          onClick={() => fileRef.current.click()}
          className="rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2"
          src={avatar || "https://via.placeholder.com/150"}
          alt="profile"
        />

        {/* 🔹 Image Upload Feedback */}
        {loading && (
          <p className="text-sm text-blue-600 text-center">Uploading image...</p>
        )}
        {uploadSuccess && !loading && (
          <p className="text-sm text-green-600 text-center">
            ✅ Image uploaded successfully!
          </p>
        )}
        {uploadError && !loading && (
          <p className="text-sm text-red-600 text-center">❌ {uploadError}</p>
        )}

        {/* 🔹 Profile Input Fields */}
        <input
          type="text"
          placeholder="Username"
          className="border p-3 rounded-lg"
          id="username"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-3 rounded-lg"
          id="email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-3 rounded-lg"
          id="password"
          value={formData.password}
          onChange={handleChange}
        />

        {/* 🔹 Submit Button */}
        <button
          disabled={loading}
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Loading..." : "Update"}
        </button>

        {/* 🔹 Profile Update Feedback */}
        {updateSuccess && !loading && (
          <p className="text-sm text-green-600 text-center mt-2">
            ✅ Profile updated successfully!
          </p>
        )}
        {updateError && !loading && (
          <p className="text-sm text-red-600 text-center mt-2">❌ {updateError}</p>
        )}
      </form>

      <div className="flex justify-between mt-5">
        <span className="text-red-700 cursor-pointer">Delete account</span>
        <span className="text-red-700 cursor-pointer">Sign out</span>
      </div>
    </div>
  );
}
