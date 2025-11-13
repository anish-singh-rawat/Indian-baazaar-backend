import dotenv from 'dotenv';
import pkg from 'google-libphonenumber';
const { PhoneNumberUtil } = pkg;
global.phoneUtil = PhoneNumberUtil.getInstance();
dotenv.config();


export const CheckpickUpAddressValidator = async(req, res, next)=>{
  try{
    const { email, phone, title, addressLineOne,
      addressLineTwo, city, pinCode, state, country  } = req.body;

    if(!email) throw { code: 409, message: 'please provide email' };

    if(!phone) throw { code: 409, message: 'please provide phone' };

    const validPhone = global.phoneUtil.parseAndKeepRawInput(phone, process.env.COUNTRY_CODE);

    if(!validPhone) throw { code: 409, message: 'please provide phone!' };

    if(!title) throw { code: 409, message: 'please provide title' };

    if(!addressLineOne) throw { code: 409, message: 'please provide address line one' };

    if(addressLineOne.length < 10) throw { code: 409, message:
        'please provide address line  must be at least of 10 character long' };

    if(!addressLineTwo) throw { code: 409, message: 'please provide address line two' };

    if(!city) throw { code: 409, message: 'please provide city' };

    if(!pinCode) throw { code: 409, message: 'please provide pin-code' };

    if( pinCode.length !== 6 ) throw { code: 409, message: 'please provide pin-code' };

    if(!state) throw { code: 409, message: 'please provide state' };

    if(!country) throw { code: 409, message: 'please provide country' };

    next()
  }
  catch (e){
    console.log("Error : hai ji ",e);
   res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

export const CheckrequestCreateOrder = (req, res, next)=>{

  try{
    
    const {
      orderId, orderDate, pickupLocation, comment, billingCustomerName,
      billingLastName, billingAddress, billingCity,
      billingPincode, billingState, billingCountry, billingEmail,
      billingPhone, orderItems, paymentMethod, subTotal,
      length, breadth, height, weight,
    } = req.body;

    if(!orderId) throw { code: 409, message: 'please provide order Id' };

    if(!orderDate) throw { code: 409, message: 'please provide order date' };

    if(!pickupLocation) throw { code: 409, message: 'please provide pick location' };
    if(!comment) throw { code: 409, message: 'please provide comment' };

    if(!billingCustomerName) throw { code: 409, message: 'please provide customer name' };

    if(!billingLastName) throw { code: 409, message: 'please provide customer last name' };

    if(!billingAddress) throw { code: 409, message: 'please provide customer address' };

    if(!billingCity) throw { code: 409, message: 'please provide customer city' };
    if(!billingPincode) throw { code: 409, message: 'please customer pincode!' };

    if(billingPincode.length !== 6 ) throw { code: 409, message: 'please provide customer pincode!' }

    if(!billingState ) throw { code: 409, message: 'please provide customer state!' };

    if(!billingCountry ) throw { code: 409, message: 'please provide customer country!' };

    if(!billingState ) throw { code: 409, message: 'please provide customer state!' };

    if(!billingEmail) throw { code: 409, message: 'please provide customer email!' };

    if(!billingPhone ) throw { code: 409, message: 'please provide customer phone!' };

    const validPhone = global.phoneUtil.parseAndKeepRawInput(billingPhone, process.env.COUNTRY_CODE);

    if(!validPhone) throw { code: 409, message: 'please provide phone!' };

    if(!orderItems) throw { code: 409, message: 'please provide orders!' };

    if(orderItems.length <=0 ) throw { code: 409, message: 'please provide orders!' };

    if(!paymentMethod) throw { code: 409,  message: 'please provide payment methods!' };

    if(!['Prepaid','Postpaid'].includes(paymentMethod)) throw { code: 409,  message: 'please provide payment methods!' };

    if(!subTotal) throw { code: 409,  message: 'please provide sub-total charges!' };

    if(!length) throw { code: 409,  message: 'please provide package length!' };

    if(!breadth) throw { code: 409,  message: 'please provide package breadth!' };

    if(!height) throw { code: 409,  message: 'please provide package height!' };

    if(!weight) throw { code: 409,  message: 'please provide package weight!' };

    next()
  }
  catch (e){
    console.log("charu error ",e);
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};


export const CheckpackageOrders = async(req, res, next)=>{

  try{

    const orders = [];

    const { orderItems } = req.body;
    console.log("yhan tak aagya bro anish")

    await orderItems.forEach(datum=>{

      const { name, sku, units, sellingPrice, discount, tax, hsn } = datum;

      if(!sku) throw { code: 409, message: 'please provide order sku' };

      if(!name) throw { code: 409, message: `SKU-${sku}: please provide order name` };

      if(!units) throw { code: 409, message: `SKU-${sku}: please provide order units` };

      if(!sellingPrice) throw { code: 409, message: `SKU-${sku}: please provide order selling price` };

      if(!tax) throw { code: 409, message: `SKU-${sku}: please provide order tax` };

      if(!hsn) throw { code: 409, message: `SKU-${sku}: please provide order hsn` };

      orders.push({
        name, sku,
        units, discount,
        selling_price: sellingPrice,
        tax, hsn,
      });

    });

    req.orderItems = orders;

    next()

  }
  catch (e){
    console.log("oaky ji :",e);

    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

export const CheckpackageParams = async (req, res, next) => {
  try {

    const {
      orderId, orderDate, pickupLocation, comment, billingCustomerName,
      billingLastName, billingAddress, billingAddressTwo , billingCity,
      billingPincode, billingState, billingCountry, billingEmail,
      billingPhone, orderItems, paymentMethod, shippingCharges,
      giftWrapCharges, transactionCharges, totalDiscount, subTotal,
      length, breadth, height, weight,
    } = req.body;

    req.order = {
      order_id: orderId,
      order_date: orderDate,
      pickup_location: pickupLocation,
      comment,
      billing_customer_name: billingCustomerName,
      billing_last_name: billingLastName, billing_address: billingAddress,
      billing_address_2: billingAddressTwo,
      billing_city: billingCity, billing_pincode: billingPincode,
      billing_state: billingState,
      billing_country: billingCountry, billing_email: billingEmail,
      billing_phone: billingPhone,
      order_items: req.orderItems,
      shipping_is_billing: true,
      payment_method: paymentMethod,
      shipping_charges: shippingCharges,
      giftwrap_charges: giftWrapCharges,
      transaction_charges: transactionCharges,
      total_discount: totalDiscount,
      sub_total: subTotal,
      length, breadth, height, weight,
    };

    next()
  }
  catch (e) {
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

export const CheckassignAWB = (req, res, next) =>{

  try{
    const { shipmentId } = req.body;

    if(!shipmentId) throw { code: 409, message: 'please provide shipment id' };

    next()
  }
  catch (e){
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

export const CheckshipmentIds = (req, res, next) =>{

  try{
    const { shipmentIds } = req.body;

    if(!shipmentIds) throw { code: 409, message: 'please provide shipment ids' };

    if(!Array.isArray(shipmentIds)) throw { code: 409, message: 'please provide shipment ids' };

    if(shipmentIds.length <=0 ) throw { code: 409, message: 'please provide shipment ids' };

    next()
  }
  catch (e){
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

export const CheckorderIds = (req, res, next) =>{

  try{
    const { orderIds } = req.body;

    if(!orderIds) throw { code: 409, message: 'please provide order ids' };

    if(!Array.isArray(orderIds)) throw { code: 409, message: 'please provide order ids' };

    if(orderIds.length <=0 ) throw { code: 409, message: 'please provide order ids' };

    next()
  }
  catch (e){
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

/*export const CheckshipmentPickUp = (req, res, next) =>{

  try{
    const { shipmentIds } = req.body;

    if(!shipmentIds) throw { code: 409, message: 'please provide shipment ids' };

    if(!Array.isArray(shipmentIds)) throw { code: 409, message: 'please provide shipment ids' };

    if(shipmentIds.length <=0 ) throw { code: 409, message: 'please provide shipment ids' };

    next()
  }
  catch (e){
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

export const CheckgenerateManifests = (req, res, next) =>{

  try{
    const { shipmentIds } = req.body;

    if(!shipmentIds) throw { code: 409, message: 'please provide shipment ids' };

    if(!Array.isArray(shipmentIds)) throw { code: 409, message: 'please provide shipment ids' };

    if(shipmentIds.length <=0 ) throw { code: 409, message: 'please provide shipment ids' };

    next()
  }
  catch (e){
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};*/
/*

export const CheckprintManifests = (req, res, next) =>{

  try{
    const { orderIds } = req.body;

    if(!orderIds) throw { code: 409, message: 'please provide order ids' };

    if(!Array.isArray(orderIds)) throw { code: 409, message: 'please provide order ids' };

    if(orderIds.length <=0 ) throw { code: 409, message: 'please provide order ids' };

    next()
  }
  catch (e){
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};*/
