import { ShipRocket } from '../helper/index.js';
import { getShiprocketToken } from '../helper/shiprocketAuth.js';
import { response } from '../utils/index.js';
export const registerPickUpAddress = async (req, res)=>{

  try{
    const { email, phone, title, addressLineOne,
      addressLineTwo, city, pinCode, state, country  } = req.body;
    let token = await getShiprocketToken();
    console.log("token : ",token);
    console.log("response : ",response);
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
    console.log("status, data, message : ",shipres?.status, shipres?.data, shipres?.message);

    if(!shipres?.status) throw { message: shipres?.message };
    response.success(res, { code: 200, message: shipres?.message, data: shipres?.data, pagination: null });
  }
  catch (e){
    console.log("Error in registering pick up address : ", e);
    return response.error(res, { code: 500, message: e.message || "Internal Server Error" });
  }
};