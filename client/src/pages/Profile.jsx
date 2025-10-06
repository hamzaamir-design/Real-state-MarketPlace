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

  // 🔹 Handle image upload to Cloudinary + update backend immediately
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    setLoading(true);
    setUploadError(null);

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "first_time_using_cloudinary");
    data.append("cloud_name", "djhjrkgfv");

    try {
      // 1️⃣ Upload image to Cloudinary
      const res = await fetch("https://api.cloudinary.com/v1_1/djhjrkgfv/image/upload", {
        method: "POST",
        body: data,
      });
      const uploadResult = await res.json();
      if (!uploadResult.url) throw new Error("Upload failed");
      const newAvatarUrl = uploadResult.url;
      setAvatar(newAvatarUrl);

      // 2️⃣ Immediately update backend (MongoDB)
      const updateRes = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: newAvatarUrl }),
      });

      const updatedUser = await updateRes.json();
      if (!updateRes.ok) throw new Error(updatedUser.message || "Failed to update user");

      // 3️⃣ Update Redux + Persisted State
      dispatch(updateUserSuccess(updatedUser));

      console.log("✅ Avatar updated successfully:", updatedUser);
    } catch (err) {
      console.error("❌ Upload or update failed:", err);
      setUploadError("Failed to upload/update image.");
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
    try {
      setLoading(true);
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatar }),
      });

      const updatedUser = await res.json();
      if (!res.ok) throw new Error(updatedUser.message || "Update failed");

      dispatch(updateUserSuccess(updatedUser));
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.message);
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

        {loading && (
          <p className="text-sm text-green-700 text-center">Uploading...</p>
        )}
        {uploadError && (
          <p className="text-sm text-red-500 text-center">{uploadError}</p>
        )}

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

        <button
          disabled={loading}
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Updating..." : "Update"}
        </button>
      </form>

      <div className="flex justify-between mt-5">
        <span className="text-red-700 cursor-pointer">Delete account</span>
        <span className="text-red-700 cursor-pointer">Sign out</span>
      </div>
    </div>
  );
}
