import { Router } from 'express'
import auth from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import upload from '../middlewares/multer.js';
import { addBlog, deleteBlog, getBlog, getBlogs, updateBlog, uploadImages } from '../controllers/blog.controller.js';

const blogRouter = Router();

blogRouter.post('/uploadImages', checkPermission({ resource: 'blog', action: 'upload' }), upload.array('images'), uploadImages);
blogRouter.post('/add', checkPermission({ resource: 'blog', action: 'create' }), addBlog);
blogRouter.get('/', getBlogs);
blogRouter.get('/:id', getBlog);
blogRouter.delete('/:id', checkPermission({ resource: 'blog', action: 'delete' }), deleteBlog);
blogRouter.put('/:id', checkPermission({ resource: 'blog', action: 'update' }), updateBlog);

export default blogRouter;