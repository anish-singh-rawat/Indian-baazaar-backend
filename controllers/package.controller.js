import { ShipRocket } from "../helper/index.js";
import { getShiprocketToken } from "../helper/shiprocketAuth.js";
import { response } from "../utils/index.js";
import { getCache, setCache } from "../utils/redisUtil.js";

import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.modal.js";
import UserModel from "../models/user.model.js";
import AddressModel from "../models/address.model.js";
import { buildShiprocketOrderPayload } from "../utils/shiprocketPayloadBuilder.js";
import mongoose from "mongoose";

export const requestCreateOrder = async (req, res) => {
  try {
    const { orderId, userId, sellerId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(orderId || userId || sellerId )) {
      throw { code: 400, message: 'Invalid orderId || userId || sellerId format' };
    }

    const order = await OrderModel.findById(orderId).lean();
    if (!order) throw { code: 404, message: 'Order not found' };

    const user = await UserModel.findById(userId).lean();
    if (!user) throw { code: 404, message: 'User not found' };
    
    let seller =  await UserModel.findById(sellerId).lean();
    if (!seller) throw { code: 404, message: 'Seller not found' };

    let deliveryAddress = await AddressModel.findById(order.delivery_address).lean();

    const productIds = order.products.map(p => p.productId).filter(Boolean);
    const products = await ProductModel.find({ _id: { $in: productIds } }).lean();

    const payload = await buildShiprocketOrderPayload({ order, user, seller, products, deliveryAddress });

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);
    const { status, data, message } = await shipRocket.requestCreateOrder(payload);

    if (!status) throw { code: 409, message };
    await OrderModel.findByIdAndUpdate(orderId, { 
      channel_order_id: data?.order_id,
      shipment_id: data?.shipment_id,
      courier_name: data?.courier_name,
      awb_code: data?.awb_code,
      packaging_box_error: data?.packaging_box_error,
      order_status: data?.order_status,
      status_code: data?.status_code,
      courier_company_id: data?.courier_company_id,
      new_channel: data?.new_channel
    }, { new: true }).lean();
    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const assignAWB = async (req, res) => {
  try {
    const { shipping_id, courier_id } = req.body;

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.generateAWB(shipping_id, courier_id);

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const generateLabel = async (req, res) => {
  try {
    const { shipping_ids } = req.body;

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.generateLabel(shipping_ids);

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const generateInvoice = async (req, res) => {
  try {
    const { orderIds,orderId } = req.body;

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.generateInvoice(orderIds, orderId);

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const shipmentPickUp = async (req, res) => {
  try {
    const { shipping_ids } = req.body;

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.shipmentPickUp(shipping_ids);

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const generateManifests = async (req, res) => {
  try {
    const { shipping_ids } = req.body;

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.generateManifests(shipping_ids);

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const printManifests = async (req, res) => {
  try {
    const { orderIds } = req.body;

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.printManifests(orderIds);

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { orderIds } = req.body;

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.deleteOrder(orderIds);

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status, page = 1, per_page = 20 } = req.query;

    const cacheKey = `shiprocket_orders_status_${status || 'all'}_page_${page}_perPage_${per_page}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return response.success(res, cachedData);
    }

    let params = { page, per_page };

    const statusMap = {
      'processing': 'new',
      'on-hold': 'on_hold',
      'confirm': 'ready_to_ship',
      'dispatched': 'picked_up',
      'in-transit': 'in_transit',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'rto': 'rto'
    };

    if (status && status !== 'all') {
      params.status = statusMap[status] || status;
    }

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status: apiStatus, data, message } = await shipRocket.getOrders(params);

    if (!apiStatus) throw { code: 409, message };

    const responseData = { code: 200, message, data, pagination: data.meta || null };
    await setCache(cacheKey, responseData);
    response.success(res, responseData);
  } catch (e) {
    response.error(res, e);
  }
};
