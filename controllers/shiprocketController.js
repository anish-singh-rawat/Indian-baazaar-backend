// controllers/shiprocketController.js
import axios from "axios";
import { getShiprocketToken } from "./shiprocketAuth.js";

const BASE = "https://apiv2.shiprocket.in/v1/external";

const sendReq = async (method, url, token, data = null, params = null) => {
    const config = {
        method,
        url,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        data,
        params,
    };
    return axios(config);
};

export const checkServiceability = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const response = await sendReq("get", `${BASE}/courier/serviceability/`, token, null, req.query);
        res.json(response.data);
    } catch (error) {
        console.error("Serviceability error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: "Failed to check serviceability", error: error.response?.data || error.message });
    }
};

// 2. create adhoc order
export const createOrder = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const payload = req.body;
        const response = await sendReq("post", `${BASE}/orders/create/adhoc`, token, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Order creation error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: "Failed to create order", error: error.response?.data || error.message });
    }
};

// 3. assign AWB/courier
export const assignAWB = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const payload = req.body; // expected { shipment_id: number, courier_id: number, ... }
        const response = await sendReq("post", `${BASE}/courier/assign/awb`, token, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Assign AWB error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: "Failed to assign AWB", error: error.response?.data || error.message });
    }
};

// 4. generate pickup
export const generatePickup = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const payload = req.body; // refer doc for format
        const response = await sendReq("post", `${BASE}/courier/generate/pickup`, token, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Generate pickup error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: "Failed to generate pickup", error: error.response?.data || error.message });
    }
};

// 5. generate manifest
export const generateManifest = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const payload = req.body; // e.g. { shipment_id: [..] } or as doc specifies
        const response = await sendReq("post", `${BASE}/manifests/generate`, token, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Generate manifest error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: "Failed to generate manifest", error: error.response?.data || error.message });
    }
};

// 6. print manifest -> returns pdf url
export const printManifest = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const payload = req.body;
        const response = await sendReq("post", `${BASE}/manifests/print`, token, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Print manifest error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: "Failed to print manifest", error: error.response?.data || error.message });
    }
};

// 7. generate label (pdf url)
export const generateLabel = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const payload = req.body; // e.g. { shipment_id: [..], format: "A4" } check docs
        const response = await sendReq("post", `${BASE}/courier/generate/label`, token, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Generate label error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: "Failed to generate label", error: error.response?.data || error.message });
    }
};

// 8. print invoice
export const printInvoice = async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const payload = req.body; // e.g. { ids: [order_id1, order_id2] }
        const response = await sendReq("post", `${BASE}/orders/print/invoice`, token, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Print invoice error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ message: "Failed to print invoice", error: error.response?.data || error.message });
    }
};
