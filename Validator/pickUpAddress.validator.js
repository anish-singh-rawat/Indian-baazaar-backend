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
      order_id, order_date, pickup_location, comment, billing_customer_name,
      billing_last_name, billing_address, billing_city,
      billing_pincode, billing_state, billing_country, billing_email,
      billing_phone, order_items, payment_method, sub_total,
      length, breadth, height, weight,
    } = req.body;

    if(!order_id) throw { code: 409, message: 'please provide order Id' };

    if(!order_date) throw { code: 409, message: 'please provide order date' };

    if(!pickup_location) throw { code: 409, message: 'please provide pick location' };
    if(!comment) throw { code: 409, message: 'please provide comment' };

    if(!billing_customer_name) throw { code: 409, message: 'please provide customer name' };

    if(!billing_last_name) throw { code: 409, message: 'please provide customer last name' };

    if(!billing_address) throw { code: 409, message: 'please provide customer address' };

    if(!billing_city) throw { code: 409, message: 'please provide customer city' };
    if(!billing_pincode) throw { code: 409, message: 'please customer pincode!' };

    if(billing_pincode.length !== 6 ) throw { code: 409, message: 'please provide customer pincode!' }

    if(!billing_state ) throw { code: 409, message: 'please provide customer state!' };

    if(!billing_country ) throw { code: 409, message: 'please provide customer country!' };

    if(!billing_state ) throw { code: 409, message: 'please provide customer state!' };

    if(!billing_email) throw { code: 409, message: 'please provide customer email!' };

    if(!billing_phone ) throw { code: 409, message: 'please provide customer phone!' };

    const validPhone = global.phoneUtil.parseAndKeepRawInput(billing_phone, process.env.COUNTRY_CODE);

    if(!validPhone) throw { code: 409, message: 'please provide phone!' };

    if(!order_items) throw { code: 409, message: 'please provide orders!' };

    if(order_items.length <=0 ) throw { code: 409, message: 'please provide orders!' };

    if(!payment_method) throw { code: 409,  message: 'please provide payment methods!' };

    if(!['Prepaid','Postpaid'].includes(payment_method)) throw { code: 409,  message: 'please provide payment methods!' };

    if(!sub_total) throw { code: 409,  message: 'please provide sub-total charges!' };

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

    const { order_items } = req.body;
    console.log("yhan tak aagya bro anish")

    await order_items.forEach(datum=>{

      const { name, sku, units, selling_price, discount, tax, hsn } = datum;

      if(!sku) throw { code: 409, message: 'please provide order sku' };

      if(!name) throw { code: 409, message: `SKU-${sku}: please provide order name` };

      if(!units) throw { code: 409, message: `SKU-${sku}: please provide order units` };

      if(!selling_price) throw { code: 409, message: `SKU-${sku}: please provide order selling price` };

      if(!tax) throw { code: 409, message: `SKU-${sku}: please provide order tax` };

      if(!hsn) throw { code: 409, message: `SKU-${sku}: please provide order hsn` };

      orders.push({
        name, sku,
        units, discount,
        selling_price: selling_price,
        tax, hsn,
      });

    });

    req.order_items = orders;

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
      order_id, order_date, pickup_location, comment, billing_customer_name,
      billing_last_name, billing_address, billingAddressTwo , billing_city,
      billing_pincode, billing_state, billing_country, billing_email,
      billing_phone, order_items, payment_method, shippingCharges,
      giftWrapCharges, transactionCharges, totalDiscount, sub_total,
      length, breadth, height, weight,
    } = req.body;

    req.order = {
      order_id: order_id,
      order_date: order_date,
      pickup_location: pickup_location,
      comment,
      billing_customer_name: billing_customer_name,
      billing_last_name: billing_last_name, billing_address: billing_address,
      billing_address_2: billingAddressTwo,
      billing_city: billing_city, billing_pincode: billing_pincode,
      billing_state: billing_state,
      billing_country: billing_country, billing_email: billing_email,
      billing_phone: billing_phone,
      order_items: req.order_items,
      shipping_is_billing: true,
      payment_method: payment_method,
      shipping_charges: shippingCharges,
      giftwrap_charges: giftWrapCharges,
      transaction_charges: transactionCharges,
      total_discount: totalDiscount,
      sub_total: sub_total,
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
    const { shipping_id } = req.body;

    if(!shipping_id) throw { code: 409, message: 'please provide shipment id' };

    next()
  }
  catch (e){
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

export const CheckshipmentIds = (req, res, next) =>{

  try{
    const { shipping_ids } = req.body;

    if(!shipping_ids) throw { code: 409, message: 'please provide shipment ids' };

    if(!Array.isArray(shipping_ids)) throw { code: 409, message: 'please provide shipment ids' };

    if(shipping_ids.length <=0 ) throw { code: 409, message: 'please provide shipment ids' };

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
    const { shipping_ids } = req.body;

    if(!shipping_ids) throw { code: 409, message: 'please provide shipment ids' };

    if(!Array.isArray(shipping_ids)) throw { code: 409, message: 'please provide shipment ids' };

    if(shipping_ids.length <=0 ) throw { code: 409, message: 'please provide shipment ids' };

    next()
  }
  catch (e){
    res.status(e.code || 500).json({ message: e.message || "Internal Server Error", error: true, success: false });
  }
};

export const CheckgenerateManifests = (req, res, next) =>{

  try{
    const { shipping_ids } = req.body;

    if(!shipping_ids) throw { code: 409, message: 'please provide shipment ids' };

    if(!Array.isArray(shipping_ids)) throw { code: 409, message: 'please provide shipment ids' };

    if(shipping_ids.length <=0 ) throw { code: 409, message: 'please provide shipment ids' };

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
