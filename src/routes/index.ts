import {Router} from "express";
import user from "./user";
import {middlewareResponse} from "../middleware/response";

const router = Router();

router.use(middlewareResponse);
router.use("/v1/user/", user);

export default router;
