import { Router } from 'express'
import auth from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import upload from '../middlewares/multer.js';
import { addBanner, deleteBanner, getBanner, getBanners, updatedBanner, uploadImages } from '../controllers/bannerList2.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';

const bannerList2Router = Router();

bannerList2Router.post('/uploadImages', checkPermission({ resource: 'bannerList2', action: 'upload' }), upload.array('images'), uploadImages);
bannerList2Router.post('/add', checkPermission({ resource: 'bannerList2', action: 'create' }), addBanner);
bannerList2Router.get('/', getBanners);
bannerList2Router.get('/:id', getBanner);
bannerList2Router.delete('/deteleImage', checkPermission({ resource: 'bannerList2', action: 'delete' }), removeImageFromCloudinary);
bannerList2Router.delete('/:id', checkPermission({ resource: 'bannerList2', action: 'delete' }), deleteBanner);
bannerList2Router.put('/:id', checkPermission({ resource: 'bannerList2', action: 'update' }), updatedBanner);

export default bannerList2Router;