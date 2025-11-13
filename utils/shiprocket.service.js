// Shiprocket service utility
// Handles address validation, warehouse creation, shipment creation, and tracking
import fetch from 'node-fetch';

const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external';
const SHIPROCKET_TOKEN = process.env.SHIPROCKET_TOKEN;

export async function validateAddress(pincode) {
  // Validate pincode serviceability
  const res = await fetch(`${SHIPROCKET_API_URL}/courier/serviceability/?pickup_postcode=${pincode}&delivery_postcode=${pincode}&cod=1&weight=0.5&order_id=TEMP`, {
    headers: { Authorization: `Bearer ${SHIPROCKET_TOKEN}` }
  });
  const data = await res.json();
  return data.status === 'success' && data.data.available_courier_companies?.length > 0;
}

export async function createWarehouse(address) {
  // Create warehouse in Shiprocket
  const res = await fetch(`${SHIPROCKET_API_URL}/warehouse/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SHIPROCKET_TOKEN}`
    },
    body: JSON.stringify(address)
  });
  return await res.json();
}

export async function createShipment(payload) {
  // Create shipment/order in Shiprocket
  const res = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SHIPROCKET_TOKEN}`
    },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function trackShipment(shipmentId) {
  // Track shipment status
  const res = await fetch(`${SHIPROCKET_API_URL}/courier/track?order_id=${shipmentId}`, {
    headers: { Authorization: `Bearer ${SHIPROCKET_TOKEN}` }
  });
  return await res.json();
}
