import Order from '../models/order.model.js';

export const markEligibleOrders = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const orders = await Order.find({
    paymentStatus: 'SUCCESS',
    shippingStatus: 'DELIVERED',
    deliveredAt: { $lte: sevenDaysAgo },
    settlementStatus: 'NOT_ELIGIBLE'
  });

  for (const order of orders) {
    order.settlementStatus = 'ELIGIBLE';
    await order.save();
  }
};
