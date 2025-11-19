export const buildShiprocketOrderPayload = ({ order, user, seller, products }) => {
  const [firstName, ...lastParts] = (user.name || '').split(' ');
  const lastName = lastParts.join(' ') || '';

  //user can have multiple addresses, try to get Exact order address which user selected during checkout
  const deliveryAddress = order.delivery_address ? order.delivery_address : (user.address_details && user.address_details[0]);

  // assemble order_items expected by Shiprocket
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

  // dimensions: try to read from product if available, fallback to defaults
  const sampleProd = products[0] || {};
  const weightVal = sampleProd.productWeight && sampleProd.productWeight.length ? parseFloat(sampleProd.productWeight[0]) || 0.5 : 0.5;

  // pickup location - try seller address
  // try to get exact address from seller who is fulfilling the order
  const sellerAddressId = seller.address_details && seller.address_details[0];
  let pickup_location = '';
  if (sellerAddressId) pickup_location = String(sellerAddressId);

  return {
    order_id: String(order._id),
    order_date: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    pickup_location : pickup_location || sellerAddressId,
    channel_id: '',
    comment: '',
    billing_customer_name: firstName || '',
    billing_last_name: lastName,
    billing_address: deliveryAddress ? (deliveryAddress.address_line1 || '') : '',
    billing_address_2: deliveryAddress && deliveryAddress.landmark ? deliveryAddress.landmark : '',
    billing_city: deliveryAddress ? (deliveryAddress.city || '') : '',
    billing_pincode: deliveryAddress ? (deliveryAddress.pincode || '') : '',
    billing_state: deliveryAddress ? (deliveryAddress.state || '') : '',
    billing_country: deliveryAddress ? (deliveryAddress.country || '') : '',
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