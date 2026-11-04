import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as controller from "../controllers/group.controller"

const router = Router();

router.use(authenticate);

router.post('/', controller.create);
router.get('/my', controller.myGroups);
router.post('/join', controller.join);
router.get('/:groupId', controller.getOne);
router.patch('/:groupId/rules',controller.updateRules);
router.get('/:groupId/members', controller.members)
router.patch(
    '/:groupId/members/:userId/role',
    controller.changeRole
);

router.delete(
    '/:groupId/members/:userId', controller.remove
)

export default router;