import express from 'express';
import {CheckpickUpAddressValidator} from '../Validator/pickUpAddress.validator';
import {registerPickUpAddress} from '../controllers/pickUpAddress.controller';

const shipRocketAddressRoute = express.Router();


shipRocketAddressRoute.post('/create', CheckpickUpAddressValidator, registerPickUpAddress);

export default shipRocketAddressRoute;
