import { ShipRocket } from "../helper/index.js";
import { getShiprocketToken } from "../helper/shiprocketAuth.js";
import { response } from "../utils/index.js";

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
