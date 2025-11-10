import { Router } from 'express'
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';
import {createProduct, createProductRAMS, deleteMultipleProduct, deleteProduct, deleteProductRAMS, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getAllProductsByThirdLavelCatId, getProduct, getProductRams, getProductsCount, updateProduct, updateProductRam, uploadImages, getProductRamsById, createProductWEIGHT, deleteProductWEIGHT, updateProductWeight, getProductWeight, getProductWeightById, createProductSize, deleteProductSize, updateProductSize, getProductSize, getProductSizeById, uploadBannerImages, getAllProductsBanners, filters, sortBy, searchProductController, getAllProductsByCat} from '../controllers/product.controller.js';

import {removeImageFromCloudinary} from '../controllers/category.controller.js';

const productRouter = Router();

productRouter.post('/uploadImages',adminAuth,upload.array('images'),uploadImages);
productRouter.post('/uploadBannerImages',adminAuth,upload.array('bannerimages'),uploadBannerImages);
productRouter.post('/create',adminAuth,createProduct);
productRouter.get('/getAllProducts',getAllProducts);
productRouter.get('/getAllProductsBanners',getAllProductsBanners);
productRouter.get('/getAllProductsByCatId/:id',getAllProductsByCatId);
productRouter.get('/getAllProductsByCatId',getAllProductsByCat);
productRouter.get('/getAllProductsByCatName',getAllProductsByCatName);
productRouter.get('/getAllProductsBySubCatId/:id',getAllProductsBySubCatId);
productRouter.get('/getAllProductsBySubCatName',getAllProductsBySubCatName);
productRouter.get('/getAllProductsByThirdLavelCat/:id',getAllProductsByThirdLavelCatId);
productRouter.get('/getAllProductsByThirdLavelCatName',getAllProductsBySubCatName);
productRouter.get('/getAllProductsByPrice',getAllProductsByPrice);
productRouter.get('/getAllProductsByRating',getAllProductsByRating);
productRouter.get('/getAllProductsCount',getProductsCount);
productRouter.get('/getAllFeaturedProducts',getAllFeaturedProducts);
productRouter.delete('/deleteMultiple',adminAuth,deleteMultipleProduct);
productRouter.delete('/:id',adminAuth,deleteProduct);
productRouter.get('/:id',getProduct);
productRouter.delete('/deteleImage',adminAuth,removeImageFromCloudinary);
productRouter.put('/updateProduct/:id',adminAuth,updateProduct);

productRouter.post('/productRAMS/create',adminAuth,createProductRAMS);
productRouter.delete('/productRAMS/:id',adminAuth,deleteProductRAMS);
productRouter.put('/productRAMS/:id',adminAuth,updateProductRam);
productRouter.get('/productRAMS/get',getProductRams);
productRouter.get('/productRAMS/:id',getProductRamsById);

productRouter.post('/productWeight/create',adminAuth,createProductWEIGHT);
productRouter.delete('/productWeight/:id',adminAuth,deleteProductWEIGHT);
productRouter.put('/productWeight/:id',adminAuth,updateProductWeight);
productRouter.get('/productWeight/get',getProductWeight);
productRouter.get('/productWeight/:id',getProductWeightById);


productRouter.post('/productSize/create',adminAuth,createProductSize);
productRouter.delete('/productSize/:id',adminAuth,deleteProductSize);
productRouter.put('/productSize/:id',adminAuth,updateProductSize);
productRouter.get('/productSize/get',getProductSize);
productRouter.get('/productSize/:id',getProductSizeById);

productRouter.post('/filters',filters);
productRouter.post('/sortBy',sortBy);
productRouter.post('/search/get',searchProductController);


export default productRouter;