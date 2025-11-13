import express from 'express';
import { trackShipment } from '../utils/shiprocket.service.js';

const router = express.Router();

// Track shipment status
router.get('/track/:shipping_id', async (req, res, next) => {
  try {
    const { shipping_id } = req.params;
    const result = await trackShipment(shipping_id);
    res.json({ success: true, tracking: result });
  } catch (err) {
    next(err);
  }
});

export default router;
