import dotenv from "dotenv";
import fetch from "node-fetch";
import { getShiprocketToken } from "../helper/shiprocketAuth.js";
dotenv.config();

const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in/v1/external";

export async function validateAddress(pincode) {
  try {
    const SHIPROCKET_TOKEN = await getShiprocketToken();
    const res = await fetch(
      `${SHIPROCKET_API_URL}/courier/serviceability/?pickup_postcode=${pincode}&delivery_postcode=${pincode}&cod=1&weight=0.5`,
      {
        headers: { Authorization: `Bearer ${SHIPROCKET_TOKEN}` },
      }
    );
    const data = await res.json();
    const isSuccess =
      data.status === 200 || data.status === "200" || data.status === "success";

    const hasCouriers =
      Array.isArray(data.data?.available_courier_companies) &&
      data.data.available_courier_companies.length > 0;

    return isSuccess && hasCouriers;
  } catch (err) {
    console.error("validateAddress Error:", err);
    return false;
  }
}

export async function createWarehouse(address) {
  const SHIPROCKET_TOKEN = await getShiprocketToken();
  const res = await fetch(`${SHIPROCKET_API_URL}/warehouse/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SHIPROCKET_TOKEN}`,
    },
    body: JSON.stringify(address),
  });
  return await res.json();
}

export async function createShipment(payload) {
  const SHIPROCKET_TOKEN = await getShiprocketToken();
  const res = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SHIPROCKET_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function trackShipment(shipping_id) {
  const SHIPROCKET_TOKEN = await getShiprocketToken();
  const res = await fetch(
    `${SHIPROCKET_API_URL}/courier/track?order_id=${shipping_id}`,
    {
      headers: { Authorization: `Bearer ${SHIPROCKET_TOKEN}` },
    }
  );
  return await res.json();
}
