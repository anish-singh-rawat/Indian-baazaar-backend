import { response } from '@utils';

export const CheckpickUpAddressValidator = async(req, res, next)=>{
  try{
    const { email, phone, title, addressLineOne,
      addressLineTwo, city, pinCode, state, country  } = req.body;

    if(!email) throw { code: 409, message: 'Invalid email' };

    if(!phone) throw { code: 409, message: 'Invalid phone' };

    const validPhone = global.phoneUtil.parseAndKeepRawInput(phone, process.env.COUNTRY_CODE);

    if(!validPhone) throw { code: 409, message: 'Invalid phone!' };

    if(!title) throw { code: 409, message: 'Invalid title' };

    if(!addressLineOne) throw { code: 409, message: 'Invalid address line one' };

    if(addressLineOne.length < 10) throw { code: 409, message:
        'Invalid address line  must be at least of 10 character long' };

    if(!addressLineTwo) throw { code: 409, message: 'Invalid address line two' };

    if(!city) throw { code: 409, message: 'Invalid city' };

    if(!pinCode) throw { code: 409, message: 'Invalid pin-code' };

    if( pinCode.length !== 6 ) throw { code: 409, message: 'Invalid pin-code' };

    if(!state) throw { code: 409, message: 'Invalid state' };

    if(!country) throw { code: 409, message: 'Invalid country' };

    next()
  }
  catch (e){
    response.error(res, e)
  }
};

const { response } = require('@utils');

export const CheckrequestCreateOrder = (req, res, next)=>{

  try{
    
    const {
      orderId, orderDate, pickupLocation, comment, billingCustomerName,
      billingLastName, billingAddress, billingCity,
      billingPincode, billingState, billingCountry, billingEmail,
      billingPhone, orderItems, paymentMethod, subTotal,
      length, breadth, height, weight,
    } = req.body;

    if(!orderId) throw { code: 409, message: 'Invalid order Id!' };

    if(!orderDate) throw { code: 409, message: 'Invalid order date!' };

    if(!pickupLocation) throw { code: 409, message: 'Invalid pick location!' };

    if(!comment) throw { code: 409, message: 'Invalid comment!' };

    if(!billingCustomerName) throw { code: 409, message: 'Invalid customer name!' };

    if(!billingLastName) throw { code: 409, message: 'Invalid customer last name!' };

    if(!billingAddress) throw { code: 409, message: 'Invalid customer address!' };

    if(!billingCity) throw { code: 409, message: 'Invalid customer city!' };

    if(!billingPincode) throw { code: 409, message: 'Invalid customer pincode!' };

    if(billingPincode.length !== 6 ) throw { code: 409, message: 'Invalid customer pincode!' }

    if(!billingState ) throw { code: 409, message: 'Invalid customer state!' };

    if(!billingCountry ) throw { code: 409, message: 'Invalid customer country!' };

    if(!billingState ) throw { code: 409, message: 'Invalid customer state!' };

    if(!billingEmail) throw { code: 409, message: 'Invalid customer email!' };

    if(!billingPhone ) throw { code: 409, message: 'Invalid customer phone!' };

    const validPhone = global.phoneUtil.parseAndKeepRawInput(billingPhone, process.env.COUNTRY_CODE);

    if(!validPhone) throw { code: 409, message: 'Invalid phone!' };

    if(!orderItems) throw { code: 409, message: 'Invalid orders!' };

    if(orderItems.length <=0 ) throw { code: 409, message: 'Invalid orders!' };

    if(!paymentMethod) throw { code: 409,  message: 'Invalid payment methods!' };

    if(!['Prepaid','Postpaid'].includes(paymentMethod)) throw { code: 409,  message: 'Invalid payment methods!' };

    if(!subTotal) throw { code: 409,  message: 'Invalid sub-total charges!' };

    if(!length) throw { code: 409,  message: 'Invalid package length!' };

    if(!breadth) throw { code: 409,  message: 'Invalid package breadth!' };

    if(!height) throw { code: 409,  message: 'Invalid package height!' };

    if(!weight) throw { code: 409,  message: 'Invalid package weight!' };

    next()
  }
  catch (e){

    response.error(res, e)
  }
};


export const CheckpackageOrders = async(req, res, next)=>{

  try{

    const orders = [];

    const { orderItems } = req.body;

    await orderItems.forEach(datum=>{

      const { name, sku, units, sellingPrice, discount, tax, hsn } = datum;

      if(!sku) throw { code: 409, message: 'Invalid order sku' };

      if(!name) throw { code: 409, message: `SKU-${sku}: Invalid order name` };

      if(!units) throw { code: 409, message: `SKU-${sku}: Invalid order units` };

      if(!sellingPrice) throw { code: 409, message: `SKU-${sku}: Invalid order selling price` };

      if(!tax) throw { code: 409, message: `SKU-${sku}: Invalid order tax` };

      if(!hsn) throw { code: 409, message: `SKU-${sku}: Invalid order hsn` };

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

    response.error(res, e)
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
    response.error(res, e)
  }
};

export const CheckassignAWB = (req, res, next) =>{

  try{
    const { shipmentId } = req.body;

    if(!shipmentId) throw { code: 409, message: 'Invalid shipment id' };

    next()
  }
  catch (e){
    response.error(res, e)
  }
};

export const CheckshipmentIds = (req, res, next) =>{

  try{
    const { shipmentIds } = req.body;

    if(!shipmentIds) throw { code: 409, message: 'Invalid shipment ids' };

    if(!Array.isArray(shipmentIds)) throw { code: 409, message: 'Invalid shipment ids' };

    if(shipmentIds.length <=0 ) throw { code: 409, message: 'Invalid shipment ids' };

    next()
  }
  catch (e){
    response.error(res, e)
  }
};

export const CheckorderIds = (req, res, next) =>{

  try{
    const { orderIds } = req.body;

    if(!orderIds) throw { code: 409, message: 'Invalid order ids' };

    if(!Array.isArray(orderIds)) throw { code: 409, message: 'Invalid order ids' };

    if(orderIds.length <=0 ) throw { code: 409, message: 'Invalid order ids' };

    next()
  }
  catch (e){
    response.error(res, e)
  }
};

/*export const CheckshipmentPickUp = (req, res, next) =>{

  try{
    const { shipmentIds } = req.body;

    if(!shipmentIds) throw { code: 409, message: 'Invalid shipment ids' };

    if(!Array.isArray(shipmentIds)) throw { code: 409, message: 'Invalid shipment ids' };

    if(shipmentIds.length <=0 ) throw { code: 409, message: 'Invalid shipment ids' };

    next()
  }
  catch (e){
    response.error(res, e)
  }
};

export const CheckgenerateManifests = (req, res, next) =>{

  try{
    const { shipmentIds } = req.body;

    if(!shipmentIds) throw { code: 409, message: 'Invalid shipment ids' };

    if(!Array.isArray(shipmentIds)) throw { code: 409, message: 'Invalid shipment ids' };

    if(shipmentIds.length <=0 ) throw { code: 409, message: 'Invalid shipment ids' };

    next()
  }
  catch (e){
    response.error(res, e)
  }
};*/
/*

export const CheckprintManifests = (req, res, next) =>{

  try{
    const { orderIds } = req.body;

    if(!orderIds) throw { code: 409, message: 'Invalid order ids' };

    if(!Array.isArray(orderIds)) throw { code: 409, message: 'Invalid order ids' };

    if(orderIds.length <=0 ) throw { code: 409, message: 'Invalid order ids' };

    next()
  }
  catch (e){
    response.error(res, e)
  }
};*/
