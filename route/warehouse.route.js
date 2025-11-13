import express from 'express';
import { shiprocketAddressValidation } from '../middlewares/shiprocketValidation.js';
import warehouseController from '../controllers/warehouse.controller.js';

const router = express.Router();

// Create new warehouse address (validate with Shiprocket)
router.post('/create', shiprocketAddressValidation, warehouseController.createWarehouse);

export default router;
