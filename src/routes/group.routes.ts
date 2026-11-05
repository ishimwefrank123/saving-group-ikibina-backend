import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as controller from "../controllers/group.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/groups:
 *   post:
 *     summary: Create a new saving group
 *     description: Creates a saving group and assigns the creator as the group-admin.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contributionAmount
 *               - contributionFrequency
 *               - loanInterestRate
 *               - maxLoanAmount
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Kigali Youth Savings
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: A group for community-based savings and low-interest loans.
 *               contributionAmount:
 *                 type: number
 *                 minimum: 0
 *                 example: 25000
 *               contributionFrequency:
 *                 type: string
 *                 enum: [weekly, monthly]
 *                 example: monthly
 *               loanInterestRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 5
 *               maxLoanAmount:
 *                 type: number
 *                 minimum: 0
 *                 example: 100000
 *     responses:
 *       201:
 *         description: Group created successfully
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
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 *                     membership:
 *                       $ref: '#/components/schemas/Membership'
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
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/groups/my:
 *   get:
 *     summary: Get all groups the authenticated user belongs to
 *     description: Returns a list of active groups where the user has a membership, including their role.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's groups
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
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         enum: [member, group-admin]
 *                         example: group-admin
 *                       group:
 *                         $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/my", controller.myGroups);

/**
 * @openapi
 * /api/groups/join:
 *   post:
 *     summary: Join a saving group with an invite code
 *     description: Adds the authenticated user as a member to the group corresponding to the invite code.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 20
 *                 example: A1B2C3D4E5
 *     responses:
 *       200:
 *         description: Joined group successfully
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
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 *                     membership:
 *                       $ref: '#/components/schemas/Membership'
 *       400:
 *         description: Already a member or invalid invite code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Group is frozen
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
router.post("/join", controller.join);

/**
 * @openapi
 * /api/groups/{groupId}:
 *   get:
 *     summary: Get saving group details
 *     description: Retrieve details for a specific group. The caller must be an active member of the group.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group
 *     responses:
 *       200:
 *         description: Group details retrieved
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
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 *                     membership:
 *                       $ref: '#/components/schemas/Membership'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not an active member of this group
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
router.get("/:groupId", controller.getOne);

/**
 * @openapi
 * /api/groups/{groupId}/rules:
 *   patch:
 *     summary: Update group rules
 *     description: Update group rules and contribution parameters. Requires group-admin role in this group.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Kigali Savings Premium
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               contributionAmount:
 *                 type: number
 *                 minimum: 0
 *                 example: 30000
 *               contributionFrequency:
 *                 type: string
 *                 enum: [weekly, monthly]
 *               loanInterestRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 4
 *               maxLoanAmount:
 *                 type: number
 *                 minimum: 0
 *                 example: 150000
 *     responses:
 *       200:
 *         description: Group rules updated successfully
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
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Group admin access required
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
router.patch("/:groupId/rules", controller.updateRules);

/**
 * @openapi
 * /api/groups/{groupId}/members:
 *   get:
 *     summary: Get group members
 *     description: Retrieve all active members in a group. Requires active membership in the group.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group
 *     responses:
 *       200:
 *         description: List of members
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 6627c2f1f3e74c001c9a9999
 *                       role:
 *                         type: string
 *                         enum: [member, group-admin]
 *                         example: member
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       403:
 *         description: Not an active member of this group
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
router.get("/:groupId/members", controller.members);

/**
 * @openapi
 * /api/groups/{groupId}/members/{userId}/role:
 *   patch:
 *     summary: Change member role
 *     description: Promote or demote a group member (member <-> group-admin). Requires group-admin role.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose role is being changed
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [member, group-admin]
 *                 example: group-admin
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Membership'
 *       400:
 *         description: Cannot change your own role, or cannot remove the only admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Group admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:groupId/members/:userId/role", controller.changeRole);

/**
 * @openapi
 * /api/groups/{groupId}/members/{userId}:
 *   delete:
 *     summary: Remove member from group
 *     description: Remove a member from the group. Requires group-admin role.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Membership'
 *       400:
 *         description: Cannot remove yourself, or cannot remove the only admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Group admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:groupId/members/:userId", controller.remove);

export default router;
