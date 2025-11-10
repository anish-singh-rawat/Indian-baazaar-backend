// trackingController.js
import axios from "axios";
import { getShiprocketToken } from "./shiprocketAuth.js";

export const trackShipment = async (req, res) => {
  const { awb } = req.params;
  try {
    const token = await getShiprocketToken();

    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Tracking error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch tracking details" });
  }
};
