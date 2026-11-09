import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as controller from "../controllers/wallet.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/wallet:
 *   get:
 *     summary: Get wallet balance and recent activity
 *     description: Returns the user's current wallet balance (calculated directly from the ledger) and recent transactions.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance: { type: number, example: 50000 }
 *                     currency: { type: string, example: "RWF" }
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LedgerEntry'
 *       401:
 *         description: Unauthorized
 */
router.get("/", controller.getSummary);

/**
 * @openapi
 * /api/wallet/top-up:
 *   post:
 *     summary: Simulate wallet top-up
 *     description: Simulates adding practice money to the user's wallet via mobile money screen.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 50000
 *               phoneNumber:
 *                 type: string
 *                 example: "0788123456"
 *               provider:
 *                 type: string
 *                 enum: [MTN, AIRTEL, OTHER]
 *                 example: "MTN"
 *     responses:
 *       201:
 *         description: Top-up processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Wallet topped up successfully (simulated)" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     newBalance: { type: number, example: 50000 }
 *                     currency: { type: string, example: "RWF" }
 *                     transaction:
 *                       $ref: '#/components/schemas/LedgerEntry'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/top-up", controller.topUp);

/**
 * @openapi
 * /api/wallet/withdraw:
 *   post:
 *     summary: Simulate wallet withdrawal
 *     description: Simulates withdrawing funds to a mobile money phone number. Fails if wallet balance would go below zero.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - phoneNumber
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 15000
 *               phoneNumber:
 *                 type: string
 *                 example: "0788123456"
 *               provider:
 *                 type: string
 *                 enum: [MTN, AIRTEL, OTHER]
 *                 example: "MTN"
 *     responses:
 *       200:
 *         description: Withdrawal processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Wallet withdrawal processed successfully (simulated)" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     newBalance: { type: number, example: 35000 }
 *                     currency: { type: string, example: "RWF" }
 *                     transaction:
 *                       $ref: '#/components/schemas/LedgerEntry'
 *       400:
 *         description: Insufficient funds or invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/withdraw", controller.withdraw);

/**
 * @openapi
 * /api/wallet/transactions:
 *   get:
 *     summary: Get user transaction history
 *     description: Retrieve all ledger transactions affecting this user's wallet with filtering and pagination.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [top-up, withdrawal, contribution, loan-payout, loan-repayment, reversal]
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
 *         description: User transaction history
 */
router.get("/transactions", controller.getTransactions);

export default router;
