import { Router } from "express";
import user from "./user";
import { userController } from "../controllers";

const router = Router();

router.post("/v1/login", userController.UserLogin);
router.use("/v1/user/", user);

export default router;
