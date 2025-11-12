import express from 'express';
import {CheckpickUpAddressValidator} from '../Validator/pickUpAddress.validator.js';
import {registerPickUpAddress} from '../controllers/pickUpAddress.controller.js';

const shipRocketAddressRoute = express.Router();


shipRocketAddressRoute.post('/create', CheckpickUpAddressValidator, registerPickUpAddress);

export default shipRocketAddressRoute;
