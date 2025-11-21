import RetailerBankDetails from '../models/retailerBankDetails.model.js';

export const checkRetailerBankDetails = async (req, res, next) => {
  try {
    const retailerId = req.userId; // Assuming req.userId is set by auth middleware

    const bankDetails = await RetailerBankDetails.findOne({ retailerId });

    if (!bankDetails) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Please complete bank details to list your product'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
