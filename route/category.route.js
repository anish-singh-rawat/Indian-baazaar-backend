import { Router } from 'express'
import auth from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import upload from '../middlewares/multer.js';
import { createCategory, deleteCategory, getCategories, getCategoriesCount, getCategory, getSubCategoriesCount, removeImageFromCloudinary, updatedCategory, uploadImages } from '../controllers/category.controller.js';

const categoryRouter = Router();

categoryRouter.post('/uploadImages', checkPermission({ resource: 'category', action: 'upload' }), upload.array('images'), uploadImages);
categoryRouter.post('/create', checkPermission({ resource: 'category', action: 'create' }), createCategory);
categoryRouter.get('/', getCategories);
categoryRouter.get('/get/count', getCategoriesCount);
categoryRouter.get('/get/count/subCat', getSubCategoriesCount);
categoryRouter.get('/:id', getCategory);
categoryRouter.delete('/deteleImage', checkPermission({ resource: 'category', action: 'delete' }), removeImageFromCloudinary);
categoryRouter.delete('/:id', checkPermission({ resource: 'category', action: 'delete' }), deleteCategory);
categoryRouter.put('/:id', checkPermission({ resource: 'category', action: 'update' }), updatedCategory);


export default categoryRouter;