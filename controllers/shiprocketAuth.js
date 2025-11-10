import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();

const AUTH_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";

let cachedToken = null;
let tokenExpiry = 0;

export const getShiprocketToken = async () => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  try {
    const resp = await axios.post(AUTH_URL, {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });

    const token = resp.data.token || resp.data.data?.token || resp.data?.data?.token;
    const ttlMs = (resp.data.expires_in ? Number(resp.data.expires_in) * 1000 : 240 * 60 * 60 * 1000);

    cachedToken = token;
    tokenExpiry = Date.now() + ttlMs - 60 * 1000; 
    return token;
  } catch (err) {
    console.error("Error generating Shiprocket token:", err.response?.data || err.message);
    throw err;
  }
};
