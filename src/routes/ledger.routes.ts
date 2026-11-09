import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePlatformAdmin } from "../middleware/authorize.js";
import * as controller from "../controllers/ledger.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/ledger/group/{groupId}:
 *   get:
 *     summary: Get group pool balance and ledger history
 *     description: Retrieve all ledger transactions for a group pool. Only visible to active group members and platform admins.
 *     tags: [Ledger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [contribution, loan-payout, loan-repayment, reversal]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Group pool ledger history
 *       403:
 *         description: Not an active member of this group
 *       404:
 *         description: Group not found
 */
router.get("/group/:groupId", controller.getGroupLedger);

/**
 * @openapi
 * /api/ledger/reversal:
 *   post:
 *     summary: Create a reversing transaction
 *     description: Records an immutable reversing transaction to correct a mistake without editing or deleting existing records.
 *     tags: [Ledger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - reason
 *             properties:
 *               transactionId:
 *                 type: string
 *                 example: "6627c2f1f3e74c001c9a1234"
 *               reason:
 *                 type: string
 *                 example: "Correction for wrong contribution recording"
 *     responses:
 *       201:
 *         description: Reversing transaction created
 *       400:
 *         description: Transaction already reversed or invalid operation
 *       404:
 *         description: Original transaction not found
 */
router.post("/reversal", controller.createReversal);

/**
 * @openapi
 * /api/ledger/all:
 *   get:
 *     summary: Get system-wide ledger (Platform Admin only)
 *     description: Retrieve all ledger transactions across the entire platform. Requires platform-admin role.
 *     tags: [Ledger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: System-wide ledger transactions
 *       403:
 *         description: Platform admin access required
 */
router.get("/all", requirePlatformAdmin, controller.getAllLedger);

export default router;
