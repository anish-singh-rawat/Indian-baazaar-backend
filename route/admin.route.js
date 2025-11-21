import express from 'express';
import { approveSettlement } from '../controllers/settlement.controller.js';
import { superAdminAuth } from '../middlewares/adminAuth.js';

const router = express.Router();

router.post('/settlements/:orderId/approve', superAdminAuth, approveSettlement);

export default router;
