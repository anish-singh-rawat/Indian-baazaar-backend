import { Router } from 'express'
import auth from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import upload from '../middlewares/multer.js';
import { addHomeSlide, deleteMultipleSlides, deleteSlide, getHomeSlides, getSlide, removeImageFromCloudinary, updatedSlide, uploadImages } from '../controllers/homeSlider.controller.js';

const homeSlidesRouter = Router();

homeSlidesRouter.post('/uploadImages', checkPermission({ resource: 'homeSlides', action: 'upload' }), upload.array('images'), uploadImages);
homeSlidesRouter.post('/add', checkPermission({ resource: 'homeSlides', action: 'create' }), addHomeSlide);
homeSlidesRouter.get('/', getHomeSlides);
homeSlidesRouter.get('/:id', getSlide);
homeSlidesRouter.delete('/deteleImage', checkPermission({ resource: 'homeSlides', action: 'delete' }), removeImageFromCloudinary);
homeSlidesRouter.delete('/:id', checkPermission({ resource: 'homeSlides', action: 'delete' }), deleteSlide);
homeSlidesRouter.delete('/deleteMultiple', checkPermission({ resource: 'homeSlides', action: 'delete' }), deleteMultipleSlides);
homeSlidesRouter.put('/:id', checkPermission({ resource: 'homeSlides', action: 'update' }), updatedSlide);


export default homeSlidesRouter;