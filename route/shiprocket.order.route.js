import express from "express";
import {
  requestCreateOrder,
  assignAWB,
  generateLabel,
  generateInvoice,
  shipmentPickUp,
  generateManifests,
  printManifests,
  deleteOrder,
} from "../controllers/package.controller.js";
import {
  CheckrequestCreateOrder,
  CheckassignAWB,
  CheckpackageOrders,
  CheckshipmentIds,
  CheckorderIds,
} from "../Validator/pickUpAddress.validator.js";

const ShipRocketOrderRoute = express.Router();

ShipRocketOrderRoute.post(
  "/create-order",
  CheckrequestCreateOrder,
  CheckpackageOrders,
  requestCreateOrder
);

ShipRocketOrderRoute.post("/assign-awb", CheckassignAWB, assignAWB);

ShipRocketOrderRoute.post("/generate-label", CheckshipmentIds, generateLabel);

ShipRocketOrderRoute.post("/generate-invoice", CheckorderIds, generateInvoice);

ShipRocketOrderRoute.post("/shipment-pickup", CheckshipmentIds, shipmentPickUp);

ShipRocketOrderRoute.post(
  "/generate-manifest",
  CheckshipmentIds,
  generateManifests
);

ShipRocketOrderRoute.post("/print-manifest", CheckorderIds, printManifests);

ShipRocketOrderRoute.delete("/delete-order", CheckorderIds, deleteOrder);

export default ShipRocketOrderRoute;
