import { ShipRocket } from '../helper/index.js';
import { getShiprocketToken } from '../helper/shiprocketAuth.js';
import { response } from '../utils/index.js';
import AddressModel from '../models/address.model.js';
import UserModel from '../models/user.model.js';
export const registerPickUpAddress = async (req, res)=>{

  try{
    const { email, phone, title, addressLineOne,
      addressLineTwo, city, pinCode, state, country, userId  } = req.body;
    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const body = {
      name: title,
      email,
      phone,
      address: addressLineOne,
      address_2: addressLineTwo,
      city,
      state,
      country,
      pin_code: pinCode,
    };

    const shipres = await shipRocket.createPickUpLocation(body);

    if(!shipres?.status) throw { message: shipres?.message };

    const addressData = {
      address_line1: addressLineOne,
      city,
      state,
      pickup_location: String(shipres?.pickup_location),
      pincode: pinCode,
      country,
      mobile: phone,
      landmark: addressLineTwo,
      addressType: 'Office', 
      userId,
    };

     let sellerDetails = await UserModel.findById(userId).lean();
     console.log("sellerDetails : ",sellerDetails);

    const existingAddress = await AddressModel.findOne(sellerDetails.address_details[0]);

    let savedAddress;
    if (existingAddress) {
      console.log("existingAddress : ",existingAddress);
      savedAddress = await AddressModel.findByIdAndUpdate(existingAddress._id, addressData, { new: true });
    } else {
      console.log("address not exist",savedAddress);
      savedAddress = new AddressModel(addressData);
      await savedAddress.save();
    }

    response.success(res, { code: 200, message: shipres?.message, data: { shiprocket: shipres?.data, localAddress: savedAddress }, pagination: null });
  }
  catch (e){
    console.log("Error in registering pick up address : ", e);
    return response.error(res, { code: 500, message: e.message || "Internal Server Error" });
  }
};