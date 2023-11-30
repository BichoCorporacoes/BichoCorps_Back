import { Router } from "express";
import { userController } from "../controllers";
import multer from "multer";
import { auth } from "../middleware/auth";
const user = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

user.post("/CreateUser", userController.CreateUser);
// user.use(auth);
user.delete("/DeleteUser/:usuarioId", userController.Deleteuser);
user.get("/ReadOnlyUser/:id", userController.ReadOnlyUserId);
user.get("/createBackUp", userController.CreateBackUp);
user.put("/updateTermo/:id", userController.UpdateTermo);
user.post("/restoreUp", upload.single("files"), userController.RestoreUp);

export default user;
