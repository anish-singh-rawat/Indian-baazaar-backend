import { Router } from 'express'
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';
import { addBlog, deleteBlog, getBlog, getBlogs, updateBlog, uploadImages } from '../controllers/blog.controller.js';

const blogRouter = Router();

blogRouter.post('/uploadImages',adminAuth,upload.array('images'),uploadImages);
blogRouter.post('/add',adminAuth,addBlog);
blogRouter.get('/',getBlogs);
blogRouter.get('/:id',getBlog);
blogRouter.delete('/:id',adminAuth,deleteBlog);
blogRouter.put('/:id',adminAuth,updateBlog);

export default blogRouter;