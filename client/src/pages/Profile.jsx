import { useSelector, useDispatch } from "react-redux";
import { useRef, useState } from "react";
import { updateUserSuccess, deleteUserFailure, deleteUserStart, deleteUserSuccess, signOutUserStart, signOutUserSuccess, signOutUserFailure } from "../redux/user/userSlice";
import { Link } from "react-router-dom";
import { set } from "mongoose";


export default function Profile() {
  const fileRef = useRef(null);
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  const [file, setFile] = useState(null);
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const [formData, setFormData] = useState({
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    password: "",
  });

  const [showListingError, setShowListingError] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });


  // 🔹 Handle file upload to Cloudinary
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Upload to Cloudinary
      const data = new FormData();
      data.append("file", selectedFile);
      data.append("upload_preset", "first_time_using_cloudinary");
      data.append("cloud_name", "djhjrkgfv");

      const uploadRes = await fetch(
        "https://api.cloudinary.com/v1_1/djhjrkgfv/image/upload",
        { method: "POST", body: data }
      );

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url)
        throw new Error(uploadData.error?.message || "Cloudinary upload failed");

      const imageUrl = uploadData.url;
      setAvatar(imageUrl);

      // Update user in backend
      const backendRes = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: imageUrl }),
      });

      const updatedUser = await backendRes.json();
      if (!backendRes.ok)
        throw new Error(updatedUser.message || "Failed to update user");

      // Update Redux store
      dispatch(updateUserSuccess(updatedUser));
      setMessage({ type: "success", text: "✅ Image uploaded successfully!" });
    } catch (err) {
      console.error("❌ Upload error:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle form field change
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  // 🔹 Handle profile update (username, email, password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatar }),
      });

      const updatedUser = await res.json();
      if (!res.ok)
        throw new Error(updatedUser.message || "Profile update failed");

      dispatch(updateUserSuccess(updatedUser));
      setMessage({ type: "success", text: "✅ Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  }

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false) {
        dispatch(signOutUserFailure(data.message));
        return;
      }
      dispatch(signOutUserSuccess(data));
    } catch (error) {
      dispatch(signOutUserFailure(data.message));
    }
  }

  const handleShowListings = async () => {
    try {
      setShowListingError(false);
      const res = await fetch(`/api/users/listings/${currentUser._id}`);
      console.log(currentUser._id);
      

      const data = await res.json();
      if (data.success === false) {
        setShowListingError(true);
        return;
      }
      setUserListings(data);
    } catch (error) {
      setShowListingError(true);

    }
  }

  const handleListingDelete = async (listingId) => {
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, {
        method: "DELETE",
        credentials: "include",
      });
    
  
      if (!res.ok) {
        const text = await res.text(); 
        console.error("Delete failed:", res.status, text);
        return;
      }

      const data = await res.json();

      // Make sure backend actually sent success:true
      if (!data.success) {
        console.error("Backend error:", data.message || "Unknown error");
        return;
      }

      // ✅ Update the local UI state
      setUserListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );

      console.log("✅ Listing deleted successfully!");
    } catch (error) {
      console.error("❌ Request failed:", error.message);
    }
  };


  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-2xl shadow-md">
      <h1 className="text-3xl font-semibold text-center mb-8">Profile</h1>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          hidden
          onChange={handleFileUpload}
        />

        {/* Avatar Preview */}
        <div
          className="relative w-24 h-24 mx-auto cursor-pointer group"
          onClick={() => fileRef.current.click()}
        >
          <img
            src={avatar || "https://placehold.co/150x150?text=No+Image"}
            alt="profile"
            className="w-24 h-24 rounded-full object-cover border border-gray-300 group-hover:opacity-80 transition"
          />
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition text-sm">
            Change
          </div>
        </div>

        {/* Feedback */}
        {loading && <p className="text-blue-600 text-center">Uploading...</p>}
        {message.text && (
          <p
            className={`text-center text-sm ${message.type === "error"
              ? "text-red-600"
              : "text-green-600 font-medium"
              }`}
          >
            {message.text}
          </p>
        )}

        {/* Form fields */}
        <input
          id="username"
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="border p-3 rounded-lg"
        />

        <input
          id="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-3 rounded-lg"
        />

        <input
          id="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="border p-3 rounded-lg"
        />

        <button
          disabled={loading}
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Loading..." : "Update"}
        </button>
        <Link className="bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95" to={"/create-listing"}>
          Create Listing
        </Link>
      </form>

      <div className="flex justify-between mt-6 text-sm">
        <span onClick={handleDeleteUser} className="text-red-700 cursor-pointer">Delete account</span>
        <span onClick={handleSignOut} className="text-red-700 cursor-pointer">Sign out</span>
      </div>
      <button onClick={handleShowListings} className="text-green-700 w-full">Show Listings</button>
      <p className="text-red-700 mt-5">{showListingError ? "Error showing listings" : ""}</p>
      {userListings && userListings.length > 0 &&
        <div className="flex flex-col gap-4">
          <h1 className="text-center mt-7 text-2xl font-semibold">Your Listings</h1>
          {userListings.map((listing) => (
            <div key={listing._id} className="border p-3 rounded-lg flex justify-between items-center gap-4">
              <Link to={`/listing/${listing._id}`}>
                <img src={listing.imageUrls[0]} alt="listing cover" className="h-16 w-16 object-contain " />
              </Link>
              <Link className="text-slate-700 font-semibold hover:underline truncate flex-1" to={`/listing/${listing._id}`}>
                <p>{listing.name}</p>
              </Link>
              <div onClick={() => handleListingDelete(listing._id)} className="flex flex-col items-center">
                <button className="text-red-700 uppercase">Delete</button>
                <button className="text-green-700 uppercase">Edit</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
