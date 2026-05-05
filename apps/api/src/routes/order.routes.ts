import { Router } from 'express';
import {
  createOrder, getOrders, getOrderDetail,
  acceptOrder, openChatOrder, rejectOrder,
  completeOrder, confirmOrder, disputeOrder,
  cancelOrder, startChat
} from '../controllers/order.controller';
import { validate } from '../middlewares/validate';
import { createOrderSchema, cancelOrderSchema } from '../schemas/order.schema';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderDetail);

// Provider actions
router.patch('/:id/accept', acceptOrder);
router.patch('/:id/open-chat', openChatOrder);
router.patch('/:id/reject', rejectOrder);
router.patch('/:id/complete', completeOrder);
router.patch('/:id/chat', startChat); // legacy

// User actions
router.patch('/:id/cancel', validate(cancelOrderSchema), cancelOrder);
router.patch('/:id/confirm', confirmOrder);
router.patch('/:id/dispute', disputeOrder);

export default router;
