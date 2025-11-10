import { Router } from 'express'
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';
import { createCategory, deleteCategory, getCategories, getCategoriesCount, getCategory, getSubCategoriesCount, removeImageFromCloudinary, updatedCategory, uploadImages } from '../controllers/category.controller.js';

const categoryRouter = Router();

categoryRouter.post('/uploadImages',adminAuth,upload.array('images'),uploadImages);
categoryRouter.post('/create',adminAuth,createCategory);
categoryRouter.get('/',getCategories);
categoryRouter.get('/get/count',getCategoriesCount);
categoryRouter.get('/get/count/subCat',getSubCategoriesCount);
categoryRouter.get('/:id',getCategory);
categoryRouter.delete('/deteleImage',adminAuth,removeImageFromCloudinary);
categoryRouter.delete('/:id',adminAuth,deleteCategory);
categoryRouter.put('/:id',adminAuth,updatedCategory);


export default categoryRouter;