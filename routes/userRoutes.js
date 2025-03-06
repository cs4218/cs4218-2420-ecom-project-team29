import express from "express";
import {
    getAllUsersController
} from "../controllers/userController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

//router object
const router = express.Router();

//routing

//all users
router.get("/all-users", requireSignIn, isAdmin, getAllUsersController);


export default router;