import { Router } from "express";
import {
  login, createUser, getUsers, updateUser, deleteUser, blockUsers, logout,
  getUserCounts,
  deleteUsers,
  depot,
  creditAccount,
  getTransactionList,
  annulerDepot
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewres/auth.middleware.js";
import { upload } from "../middlewres/upload.js";
// import { depot } from "../controllers/depot.js";

const router = Router();

// Auth
router.post("/login", login);
router.post("/logout", logout);

// CRUD
router.post("/user",upload.single('photo'), createUser);
router.get("/users", getUsers);
router.put("/users/:id",upload.single("photo"), updateUser);
router.delete("/user/:id", authenticateToken, deleteUser);
router.delete("/users",authenticateToken, deleteUsers);
router.get("/getuserscount",getUserCounts)
router.post("/depot", authenticateToken, depot);
router.post("/depotadmin", creditAccount);
router.get("/getAlltransactions", getTransactionList);
router.post("/annulerdepot", annulerDepot);
// Bloquer
router.put("/user/blocked", blockUsers);

export default router;
