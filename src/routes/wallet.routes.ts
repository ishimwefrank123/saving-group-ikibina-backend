import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";


import {
  getMyWallet,
  getWalletBalance,
  topUpWallet,
  withdrawFromWallet,
  getTransactionHistory
} from "../controllers/wallet.controller.js";

const router = Router();

// All wallet operations require authentication.
router.use(authenticate);

router.get("/me", getMyWallet);

router.get("/balance", getWalletBalance);

router.post("/top-up", topUpWallet);

router.post("/withdraw", withdrawFromWallet);

router.get("/transactions", getTransactionHistory);

export default router;