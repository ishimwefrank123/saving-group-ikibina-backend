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
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get("/dashboard", controller.dashboard);

/**
 * @openapi
 * /api/platform-admin/users:
 *   get:
 *     summary: List platform users
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, blocked]
 *       - in: query
 *         name: platformRole
 *         schema:
 *           type: string
 *           enum: [user, platform-admin]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/users", controller.users);

router.get("/users/:userId", controller.getUser);
router.patch("/users/:userId/status", controller.userStatus);

/**
 * @openapi
 * /api/platform-admin/groups:
 *   get:
 *     summary: List all saving groups
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, frozen]
 *     responses:
 *       200:
 *         description: List of groups
 */
router.get("/groups", controller.groups);

router.get("/groups/:groupId", controller.getGroup);
router.patch("/groups/:groupId/status", controller.groupStatus);

/**
 * @openapi
 * /api/platform-admin/issues:
 *   get:
 *     summary: List all platform issues
 *     tags: [Platform Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in-review, resolved, dismissed]
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of issues
 */
router.get("/issues", controller.issues);

router.get("/issues/:issueId", controller.getIssue);
router.patch("/issues/:issueId", controller.updateIssue);

export default router;