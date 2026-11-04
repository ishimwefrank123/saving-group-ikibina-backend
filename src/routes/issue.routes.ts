import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { create } from "../controllers/issue.controller";

const router = Router();

router.use(authenticate);

router.post('/', create);

export default router;