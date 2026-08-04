import { Router } from 'express';
import {
  getCategories, createCategory, updateCategory, toggleCategory,
  getCategoryProviders, checkCategoryDelete, deleteCategory,
  getSkills, createSkill, updateSkill, toggleSkill,
  getSkillProviders, checkSkillDelete, deleteSkill,
  getServiceTypes, createServiceType, updateServiceType, toggleServiceType, deleteServiceType,
  getApplications, getApplicationDetail, approveApplication, rejectApplication, openApplicationChat,
  getOrgApplications, approveOrgApplication, rejectOrgApplication,
  getAdminOrganizations, updateOrganization, toggleOrganization,
  getUsers, getUserDetail, changeUserRole, changeUserStatus, deleteUser,
  getAdminChats, createAdminChat, getAdminChatMessages, sendAdminChatMessage,
  broadcastNotification, sendNotificationToUser
} from '../controllers/admin.controller';
import { resolveDispute } from '../controllers/order.controller';
import { validate } from '../middlewares/validate';
import { createCategorySchema, createSkillSchema } from '../schemas/admin.schema';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate, authorize('SUPER_ADMIN'));

// Categories
router.get('/categories', getCategories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.patch('/categories/:id', updateCategory);
router.patch('/categories/:id/toggle', toggleCategory);
router.get('/categories/:id/providers', getCategoryProviders);
router.get('/categories/:id/check-delete', checkCategoryDelete);
router.delete('/categories/:id', deleteCategory);

// Skills
router.get('/skills', getSkills);
router.post('/skills', validate(createSkillSchema), createSkill);
router.patch('/skills/:id', updateSkill);
router.patch('/skills/:id/toggle', toggleSkill);
router.get('/skills/:id/providers', getSkillProviders);
router.get('/skills/:id/check-delete', checkSkillDelete);
router.delete('/skills/:id', deleteSkill);

// Service Types
router.get('/service-types', getServiceTypes);
router.post('/service-types', createServiceType);
router.patch('/service-types/:id', updateServiceType);
router.patch('/service-types/:id/toggle', toggleServiceType);
router.delete('/service-types/:id', deleteServiceType);


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
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};
    if (!status || status === 'ALL') {
      // Hammasi: DISPUTED va hal qilinganlar (resolvedBy bor)
      where = {
        OR: [
          { status: 'DISPUTED' },
          { resolvedBy: { not: null } }
        ]
      };
    } else if (status === 'DISPUTED') {
      where = { status: 'DISPUTED' };
    } else if (status === 'RESOLVED') {
      // RESOLVED = resolvedBy mavjud bo'lgan COMPLETED yoki FAILED
      where = {
        resolvedBy: { not: null },
        status: { in: ['COMPLETED', 'FAILED'] }
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          provider: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          skill: true,
          resolver: { select: { id: true, name: true, firstName: true, lastName: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.order.count({ where })
    ]);

    res.json({ success: true, data: { orders, total, page: pageNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { next(error); }
});
router.patch('/orders/:id/resolve', resolveDispute);

export default router;
