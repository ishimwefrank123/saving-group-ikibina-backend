import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { create } from "../controllers/issue.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/issues:
 *   post:
 *     summary: Report a group issue or dispute
 *     description: Submit an issue related to a saving group. User must be an active member of that group.
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - subject
 *               - description
 *             properties:
 *               groupId:
 *                 type: string
 *                 pattern: '^[a-f\d]{24}$'
 *                 example: 6627c2f1f3e74c001c9a5678
 *                 description: 24-character hexadecimal MongoDB ObjectId of the group
 *               subject:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 120
 *                 example: Missing contribution record
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 3000
 *                 example: I sent my contribution on Friday but it is not reflected in the ledger.
 *     responses:
 *       201:
 *         description: Issue reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Issue reported successfully
 *                 data:
 *                   $ref: '#/components/schemas/Issue'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: You must be an active group member to report an issue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", create);

export default router;
