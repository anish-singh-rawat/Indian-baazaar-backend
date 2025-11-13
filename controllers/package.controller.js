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
    const { shipmentId } = req.body;

        let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.generateAWB(shipmentId);

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const generateLabel = async (req, res) => {
  try {
    const { shipmentIds } = req.body;

        let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.generateLabel(
      shipmentIds
    );

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

    const { status, data, message } = await shipRocket.generateInvoice(
      orderIds
    );

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const shipmentPickUp = async (req, res) => {
  try {
    const { shipmentIds } = req.body;

        let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.shipmentPickUp(
      shipmentIds
    );

    if (!status) throw { code: 409, message };

    response.success(res, { code: 200, message, data, pagination: null });
  } catch (e) {
    response.error(res, e);
  }
};

export const generateManifests = async (req, res) => {
  try {
    const { shipmentIds } = req.body;

        let token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    const { status, data, message } = await shipRocket.generateManifests(
      shipmentIds
    );

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
