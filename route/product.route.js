import { Router } from 'express'
import { checkPermission } from '../middlewares/checkPermission.js';
import upload from '../middlewares/multer.js';
import {createProduct, createProductRAMS, deleteMultipleProduct, deleteProduct, deleteProductRAMS, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getAllProductsByThirdLavelCatId, getProduct, getProductRams, getProductsCount, updateProduct, updateProductRam, uploadImages, getProductRamsById, createProductWEIGHT, deleteProductWEIGHT, updateProductWeight, getProductWeight, getProductWeightById, createProductSize, deleteProductSize, updateProductSize, getProductSize, getProductSizeById, uploadBannerImages, getAllProductsBanners, filters, sortBy, searchProductController, getAllProductsByCat} from '../controllers/product.controller.js';

import { checkRetailerBankDetails } from '../middlewares/checkRetailerBankDetails.js';
import { removeImageFromCloudinary } from '../controllers/user.controller.js';

const productRouter = Router();

productRouter.post('/uploadImages', checkPermission({ resource: 'product', action: 'upload' }), upload.array('images'), uploadImages);
productRouter.post('/uploadBannerImages', checkPermission({ resource: 'product', action: 'upload' }), upload.array('bannerimages'), uploadBannerImages);
productRouter.post('/create', checkPermission({ resource: 'product', action: 'create' }), checkRetailerBankDetails, createProduct);
productRouter.get('/getAllProducts',  getAllProducts);
productRouter.get('/getAllProductsBanners', getAllProductsBanners);
productRouter.get('/getAllProductsByCatId/:id', getAllProductsByCatId);
productRouter.get('/getAllProductsByCatId', getAllProductsByCat);
productRouter.get('/getAllProductsByCatName', getAllProductsByCatName);
productRouter.get('/getAllProductsBySubCatId/:id', getAllProductsBySubCatId);
productRouter.get('/getAllProductsBySubCatName', getAllProductsBySubCatName);
productRouter.get('/getAllProductsByThirdLavelCat/:id', getAllProductsByThirdLavelCatId);
productRouter.get('/getAllProductsByThirdLavelCatName', getAllProductsBySubCatName);
productRouter.get('/getAllProductsByPrice', getAllProductsByPrice);
productRouter.get('/getAllProductsByRating', getAllProductsByRating);
productRouter.get('/getAllProductsCount', getProductsCount);
productRouter.get('/getAllFeaturedProducts', getAllFeaturedProducts);
productRouter.delete('/deleteMultiple', checkPermission({ resource: 'product', action: 'delete' }), deleteMultipleProduct);
productRouter.delete('/:id', checkPermission({ resource: 'product', action: 'delete' }), deleteProduct);
productRouter.get('/:id', getProduct);
productRouter.delete('/deteleImage', checkPermission({ resource: 'product', action: 'delete' }), removeImageFromCloudinary);
productRouter.put('/updateProduct/:id', checkPermission({ resource: 'product', action: 'update' }), updateProduct);

productRouter.post('/productRAMS/create', checkPermission({ resource: 'productRAMS', action: 'create' }), createProductRAMS);
productRouter.delete('/productRAMS/:id', checkPermission({ resource: 'productRAMS', action: 'delete' }), deleteProductRAMS);
productRouter.put('/productRAMS/:id', checkPermission({ resource: 'productRAMS', action: 'update' }), updateProductRam);
productRouter.get('/productRAMS/get', getProductRams);
productRouter.get('/productRAMS/:id', getProductRamsById);

productRouter.post('/productWeight/create', checkPermission({ resource: 'productWeight', action: 'create' }), createProductWEIGHT);
productRouter.delete('/productWeight/:id', checkPermission({ resource: 'productWeight', action: 'delete' }), deleteProductWEIGHT);
productRouter.put('/productWeight/:id', checkPermission({ resource: 'productWeight', action: 'update' }), updateProductWeight);
productRouter.get('/productWeight/get', getProductWeight);
productRouter.get('/productWeight/:id', getProductWeightById);


productRouter.post('/productSize/create', checkPermission({ resource: 'productSize', action: 'create' }), createProductSize);
productRouter.delete('/productSize/:id', checkPermission({ resource: 'productSize', action: 'delete' }), deleteProductSize);
productRouter.put('/productSize/:id', checkPermission({ resource: 'productSize', action: 'update' }), updateProductSize);
productRouter.get('/productSize/get', getProductSize);
productRouter.get('/productSize/:id', getProductSizeById);

productRouter.post('/filters', filters);
productRouter.post('/sortBy', sortBy);
productRouter.post('/search/get', searchProductController);


export default productRouter;