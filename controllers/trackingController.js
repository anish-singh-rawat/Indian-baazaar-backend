// trackingController.js
import axios from "axios";
import { getShiprocketToken } from "../helper/shiprocketAuth.js";
import { getCache, setCache } from '../utils/redisUtil.js';

export const TrackShipmentRealTime = async (req, res) => {
  const { awb } = req.params;
  const cacheKey = `tracking_${awb}`;
  try {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    const token = await getShiprocketToken();

    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Tracking error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch tracking details" });
  }
};
