import { Router } from 'express';
import {
  getOrganizations,
  getOrganizationById,
  getOrganizationOrders,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember
} from '../controllers/organization.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public
router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);

// Authenticated
router.get('/:id/orders', authenticate, getOrganizationOrders);
router.get('/:id/join-requests', authenticate, getJoinRequests);
router.post('/:id/join-requests/:reqId/approve', authenticate, approveJoinRequest);
router.post('/:id/join-requests/:reqId/reject', authenticate, rejectJoinRequest);
router.delete('/:id/members/:providerId', authenticate, removeMember);

export default router;
