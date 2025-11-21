import AddressModel from "../models/address.model.js";

export const buildShiprocketOrderPayload = async ({ order, user, seller, products, deliveryAddress }) => {
  const [firstName, ...lastParts] = (user.name || '').split(' ');
  const lastName = lastParts.join(' ') || '';

  const address = deliveryAddress || (user.address_details && user.address_details[0]);

  const order_items = order.products.map((p) => {
    const prod = products.find(x => String(x._id) === String(p.productId));
    return {
      name: p.productTitle || (prod && prod.name),
      sku: p.productId,
      units: p.quantity || 1,
      selling_price: p.price || (prod && prod.price) || 0,
    };
  });

  const sub_total = order.products.reduce((acc, cur) => acc + (cur.sub_total || (cur.price * (cur.quantity || 1)) || 0), 0);

  const sampleProd = products[0] || {};
  const weightVal = sampleProd.productWeight && sampleProd.productWeight.length ? parseFloat(sampleProd.productWeight[0]) || 0.5 : 0.5;

  const sellerAddressDoc = await AddressModel.findById(seller.address_details[0]);
  if (!sellerAddressDoc?.pickup_location) {
    throw new Error("Missing required fields: pickup_location");
  }

  const pickup_location = sellerAddressDoc.pickup_location;

  console.log("seller pickup_location address :", pickup_location);
 
  return {
    order_id: String(order._id),
    order_date: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    pickup_location,
    channel_id: '',
    comment: '',
    billing_customer_name: firstName || '',
    billing_last_name: lastName,
    billing_address: address ? (address.address_line1 || '') : '',
    billing_address_2: address?.landmark || '',
    billing_city: address?.city || '',
    billing_pincode: address?.pincode || '',
    billing_state: address?.state || '',
    billing_country: address?.country || '',
    billing_email: user.email || '',
    billing_phone: user.mobile || '',
    shipping_is_billing: true,
    order_items,
    payment_method: order.payment_status || 'Prepaid',
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total,
    length: 10,
    breadth: 10,
    height: 10,
    weight: weightVal,
  };
};