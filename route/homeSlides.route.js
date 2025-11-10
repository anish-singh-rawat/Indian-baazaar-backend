import { Router } from 'express'
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';
import { addHomeSlide, deleteMultipleSlides, deleteSlide, getHomeSlides, getSlide, removeImageFromCloudinary, updatedSlide, uploadImages } from '../controllers/homeSlider.controller.js';

const homeSlidesRouter = Router();

homeSlidesRouter.post('/uploadImages',adminAuth,upload.array('images'),uploadImages);
homeSlidesRouter.post('/add',adminAuth,addHomeSlide);
homeSlidesRouter.get('/',getHomeSlides);
homeSlidesRouter.get('/:id',getSlide);
homeSlidesRouter.delete('/deteleImage',adminAuth,removeImageFromCloudinary);
homeSlidesRouter.delete('/:id',adminAuth,deleteSlide);
homeSlidesRouter.delete('/deleteMultiple',adminAuth,deleteMultipleSlides);
homeSlidesRouter.put('/:id',adminAuth,updatedSlide);


export default homeSlidesRouter;