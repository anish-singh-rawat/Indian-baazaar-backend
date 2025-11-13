// Middleware to validate address with Shiprocket before saving
import { validateAddress } from '../utils/shiprocket.service.js';

export async function shiprocketAddressValidation(req, res, next) {
  const { pincode } = req.body;
  if (!pincode) return res.status(400).json({ error: true, message: 'Pincode is required.' });
  try {
    const isValid = await validateAddress(pincode);
    if (!isValid) {
      return res.status(400).json({ error: true, message: 'Address not serviceable by Shiprocket. Please update your address.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}
