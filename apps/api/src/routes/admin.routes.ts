import { Router } from 'express';
import {
  getCategories, createCategory, updateCategory, toggleCategory,
  getSkills, createSkill, updateSkill, toggleSkill,
  getApplications, getApplicationDetail, approveApplication, rejectApplication, openApplicationChat,
  getOrgApplications, approveOrgApplication, rejectOrgApplication,
  getAdminOrganizations, updateOrganization, toggleOrganization,
  getUsers, getUserDetail, changeUserRole, changeUserStatus, deleteUser,
  getAdminChats, createAdminChat, getAdminChatMessages, sendAdminChatMessage,
  broadcastNotification, sendNotificationToUser
} from '../controllers/admin.controller';
import { resolveDispute } from '../controllers/order.controller';
import { validate } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema, createSkillSchema, updateSkillSchema } from '../schemas/admin.schema';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate, authorize('SUPER_ADMIN'));

// Categories
router.get('/categories', getCategories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.patch('/categories/:id', validate(updateCategorySchema), updateCategory);
router.patch('/categories/:id/toggle', toggleCategory);

// Skills
router.get('/skills', getSkills);
router.post('/skills', validate(createSkillSchema), createSkill);
router.patch('/skills/:id', validate(updateSkillSchema), updateSkill);
router.patch('/skills/:id/toggle', toggleSkill);

// Provider Applications
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationDetail);
router.patch('/applications/:id/approve', approveApplication);
router.patch('/applications/:id/reject', rejectApplication);
router.patch('/applications/:id/open-chat', openApplicationChat);

// Organization Applications
router.get('/organizations/applications', getOrgApplications);
router.post('/organizations/applications/:id/approve', approveOrgApplication);
router.post('/organizations/applications/:id/reject', rejectOrgApplication);

// Organizations Management
router.get('/organizations', getAdminOrganizations);
router.patch('/organizations/:id', updateOrganization);
router.patch('/organizations/:id/toggle', toggleOrganization);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/role', changeUserRole);
router.patch('/users/:id/status', changeUserStatus);
router.delete('/users/:id', deleteUser);

// Admin Chats
router.get('/chats', getAdminChats);
router.post('/chats', createAdminChat);
router.get('/chats/:id/messages', getAdminChatMessages);
router.post('/chats/:id/messages', sendAdminChatMessage);

// Admin Notifications
router.post('/notifications/broadcast', broadcastNotification);
router.post('/notifications/send', sendNotificationToUser);

// Disputed Orders
router.get('/orders/disputed', async (req, res, next) => {
  try {
    const { prisma } = await import('../lib/prisma');
    const orders = await prisma.order.findMany({
      where: { status: 'DISPUTED' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        provider: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        skill: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) { next(error); }
});
router.patch('/orders/:id/resolve', resolveDispute);

export default router;
