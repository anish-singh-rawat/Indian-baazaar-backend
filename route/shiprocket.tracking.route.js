import express from 'express';
import { trackShipment } from '../utils/shiprocket.service.js';

const router = express.Router();

// Track shipment status
router.get('/track/:shipmentId', async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const result = await trackShipment(shipmentId);
    res.json({ success: true, tracking: result });
  } catch (err) {
    next(err);
  }
});

export default router;
