import { Router } from 'express'
import {addReview, authWithGoogle, changePasswordController, forgotPasswordController, getAllReviews, getAllUsers, getReviews, loginAdminController, loginUserController, logoutController, refreshToken, registerUserController, removeImageFromCloudinary, resetpassword, updateUserDetails, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp} from '../controllers/user.controller.js';
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';

const userRouter = Router()
userRouter.post('/register',registerUserController)
userRouter.post('/verifyEmail',verifyEmailController)
userRouter.post('/login',loginUserController)
userRouter.post('/authWithGoogle',authWithGoogle)
userRouter.get('/logout',auth,logoutController);
userRouter.post('/admin-login',loginAdminController)

// Admin-only: update user avatar
userRouter.put('/user-avatar',adminAuth,upload.array('avatar'),userAvatarController);
userRouter.delete('/deteleImage',auth,removeImageFromCloudinary);
userRouter.put('/:id',adminAuth,updateUserDetails);
userRouter.post('/forgot-password',forgotPasswordController)
userRouter.post('/verify-forgot-password-otp',verifyForgotPasswordOtp)
userRouter.post('/reset-password',resetpassword)
userRouter.post('/forgot-password/change-password',changePasswordController)
userRouter.post('/refresh-token',refreshToken)
userRouter.get('/user-details',auth,userDetails);
userRouter.post('/addReview',auth,addReview);
userRouter.get('/getReviews',getReviews);
userRouter.get('/getAllReviews',getAllReviews);
userRouter.get('/getAllUsers',getAllUsers);


export default userRouter