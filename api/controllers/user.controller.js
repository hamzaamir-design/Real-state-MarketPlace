import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import bcryptjs from "bcryptjs";

export const updateUser = async (req, res, next) => {
 
  if (req.user.id !== req.params.id) {
    return next(errorHandler(403, "You are not allowed to update this user!"));
  }

  try {
   
    let updatedFields = {
      username: req.body.username,
      email: req.body.email,
      avatar: req.body.avatar,
    };

    if (req.body.password) {
      const hashedPassword = bcryptjs.hashSync(req.body.password, 10);
      updatedFields.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedUser) {
      return next(errorHandler(404, "User not found"));
    }

    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (err) {
    next(errorHandler(500, "Failed to update user"));
  }
};

export const test = (req, res) => {
  res.json({ message: "Hello World" });
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You are not allowed to delete this user!"));
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie("access_token")
    res.status(200).json({ message: "User has been deleted." });
  } catch (error) {
    next(error)
  }
}
