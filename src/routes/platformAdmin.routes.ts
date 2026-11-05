import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePlatformAdmin } from "../middleware/authorize.js";
import * as controller from "../controllers/platformAdmin.controller.js";

const router = Router();

router.use(authenticate, requirePlatformAdmin);

/**
 * @openapi
 * /api/platform-admin/dashboard:
 *   get:
 *     summary: Get platform administrator dashboard statistics
 *     description: Returns overall platform metrics including total users, active users, groups, and open issues. Requires platform-admin role.
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: number
 *                       example: 120
 *                     activeUsers:
 *                       type: number
 *                       example: 115
 *                     groups:
 *                       type: number
 *                       example: 18
 *                     activeGroups:
 *                       type: number
 *                       example: 16
 *                     openIssues:
 *                       type: number
 *                       example: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/dashboard", controller.dashboard);

/**
 * @openapi
 * /api/platform-admin/users:
 *   get:
 *     summary: List platform users
 *     description: Retrieve the recent 200 users across the entire platform. Requires platform-admin role.
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/users", controller.users);

/**
 * @openapi
 * /api/platform-admin/groups:
 *   get:
 *     summary: List all saving groups
 *     description: Retrieve the recent 200 saving groups on the platform. Requires platform-admin role.
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/groups", controller.groups);

/**
 * @openapi
 * /api/platform-admin/issues:
 *   get:
 *     summary: List all platform issues
 *     description: Retrieve all reported member issues and disputes. Requires platform-admin role.
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of issues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Issue'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/issues", controller.issues);

/**
 * @openapi
 * /api/platform-admin/users/{userId}/status:
 *   patch:
 *     summary: Update user account status
 *     description: Activate or block a user account. Admins cannot block their own account. Requires platform-admin role.
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, blocked]
 *                 example: blocked
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: You cannot block your own account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/users/:userId/status",
  controller.userStatus
);

/**
 * @openapi
 * /api/platform-admin/groups/{groupId}/status:
 *   patch:
 *     summary: Update group status (active/frozen)
 *     description: Freeze or unfreeze a saving group. A reason is required when freezing a group. Requires platform-admin role.
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, frozen]
 *                 example: frozen
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: Group frozen pending audit of unauthorized loans.
 *     responses:
 *       200:
 *         description: Group status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         description: A reason is required when freezing a group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/groups/:groupId/status",
  controller.groupStatus
);

/**
 * @openapi
 * /api/platform-admin/issues/{issueId}:
 *   patch:
 *     summary: Update issue status and admin note
 *     description: Mark an issue as open, in-review, resolved, or dismissed, and optionally record an admin note. Requires platform-admin role.
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the issue to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in-review, resolved, dismissed]
 *                 example: resolved
 *               adminNote:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Issue investigated and resolved with the group admin.
 *     responses:
 *       200:
 *         description: Issue updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Issue'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/issues/:issueId",
  controller.updateIssue
);

export default router;
