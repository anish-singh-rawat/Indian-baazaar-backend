// Controller for warehouse creation
import { createWarehouse as createShiprocketWarehouse } from '../utils/shiprocket.service.js';

const warehouseController = {
  async createWarehouse(req, res, next) {
    try {
      const address = req.body;
      // Create warehouse in Shiprocket
      const result = await createShiprocketWarehouse(address);
      if (result.status !== 'success') {
        return res.status(400).json({ error: true, message: result.message || 'Failed to create warehouse in Shiprocket.' });
      }
      // Save warehouse in local DB (implement as needed)
      // ...
      res.json({ success: true, warehouse: result.data });
    } catch (err) {
      next(err);
    }
  }
};

export default warehouseController;
