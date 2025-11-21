import express from 'express';
import { addOrUpdateBankDetails } from '../controllers/retailer.controller.js';
import auth from '../middlewares/auth.js'; // Assuming auth middleware exists

const router = express.Router();

router.post('/bank-details', auth, addOrUpdateBankDetails);

export default router;
