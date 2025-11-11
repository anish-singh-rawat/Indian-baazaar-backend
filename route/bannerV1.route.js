import { Router } from 'express'
import auth from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import upload from '../middlewares/multer.js';
import { addBanner, deleteBanner, getBanner, getBanners, updatedBanner, uploadImages } from '../controllers/bannerV1.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';

const bannerV1Router = Router();

bannerV1Router.post('/uploadImages', checkPermission({ resource: 'bannerV1', action: 'upload' }), upload.array('images'), uploadImages);
bannerV1Router.post('/add', checkPermission({ resource: 'bannerV1', action: 'create' }), addBanner);
bannerV1Router.get('/', getBanners);
bannerV1Router.get('/:id', getBanner);
bannerV1Router.delete('/deteleImage', checkPermission({ resource: 'bannerV1', action: 'delete' }), removeImageFromCloudinary);
bannerV1Router.delete('/:id', checkPermission({ resource: 'bannerV1', action: 'delete' }), deleteBanner);
bannerV1Router.put('/:id', checkPermission({ resource: 'bannerV1', action: 'update' }), updatedBanner);

export default bannerV1Router;