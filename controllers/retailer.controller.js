import RetailerBankDetails from '../models/retailerBankDetails.model.js';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Validation functions
const validateIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

const validateAccountNumber = (accountNumber) => {
  return /^\d+$/.test(accountNumber);
};

export const addOrUpdateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, bankName, accountNumber, ifscCode, branchName, upiId } = req.body;
    const retailerId = req.userId; // Assuming set by auth middleware

    // Validate inputs
    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'All required fields must be provided'
      });
    }

    if (!validateIFSC(ifscCode)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid IFSC code format'
      });
    }

    if (!validateAccountNumber(accountNumber)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Account number must be numeric'
      });
    }

    // Check if bank details already exist
    let bankDetails = await RetailerBankDetails.findOne({ retailerId });

    if (bankDetails) {
      // Update existing
      bankDetails.accountHolderName = accountHolderName;
      bankDetails.bankName = bankName;
      bankDetails.accountNumber = accountNumber;
      bankDetails.ifscCode = ifscCode;
      bankDetails.branchName = branchName;
      bankDetails.upiId = upiId;
    } else {
      // Create new
      bankDetails = new RetailerBankDetails({
        retailerId,
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        branchName,
        upiId
      });
    }

    // Create Razorpay Fund Account
    try {
      const fundAccount = await razorpay.fundAccount.create({
        account_type: 'bank_account',
        bank_account: {
          name: accountHolderName,
          account_number: accountNumber,
          ifsc: ifscCode
        }
      });

      bankDetails.razorpayFundAccountId = fundAccount.id;
    } catch (razorpayError) {
      console.error('Razorpay Fund Account Creation Error:', razorpayError);
      return res.status(500).json({
        error: true,
        success: false,
        message: 'Failed to create fund account with Razorpay'
      });
    }

    await bankDetails.save();

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Bank details saved successfully',
      data: bankDetails
    });
  } catch (error) {
    console.error('Error saving bank details:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
