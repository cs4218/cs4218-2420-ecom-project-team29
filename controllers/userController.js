import userModel from "../models/userModel.js";

export const getAllUsersController = async (req, res) => {
  try {
    const users = await userModel
        .find({})
        .select("-password")
        .sort({ createdAt: -1 });
    res.status(200).send({
        success: true,
        countTotal: users.length,
        message: "All Users",
        users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ 
        success: false,
        message: "Error in getting all users",
        error: error.message,
    });
  }
};