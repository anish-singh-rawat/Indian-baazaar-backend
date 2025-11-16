import { ShipRocket } from "../helper/index.js";
import { getShiprocketToken } from "../helper/shiprocketAuth.js";
import { response } from "../utils/index.js";
import { getCache, setCache } from "../utils/redisUtil.js";

export const requestCreateOrder = async (req, res) => {
  try {
    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);
    const { status, data, message } = await shipRocket.requestCreateOrder(req.body);

    if (!status) throw { code: 409, message };

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
    const { orderIds } = req.body;

    let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.generateInvoice(orderIds);

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
