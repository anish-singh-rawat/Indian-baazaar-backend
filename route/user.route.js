import { Router } from 'express'
import {addReview, authWithGoogle, changePasswordController, forgotPasswordController, getAllReviews, getAllUsers, getReviews, loginAdminController, loginUserController, logoutController, refreshToken, registerRetailerController, registerUserController, removeImageFromCloudinary, resetpassword, updateUserDetails, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp} from '../controllers/user.controller.js';
import { shiprocketAddressValidation } from '../middlewares/shiprocketValidation.js';
import auth from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import upload from '../middlewares/multer.js';

const userRouter = Router()
userRouter.post('/register',registerUserController)
userRouter.post('/register-retailer', shiprocketAddressValidation, registerRetailerController)
userRouter.post('/verifyEmail',verifyEmailController)
userRouter.post('/login',loginUserController)
userRouter.post('/authWithGoogle',authWithGoogle)
userRouter.get('/logout',auth,logoutController);
userRouter.post('/admin-login',loginAdminController)

// Admin-only: update user avatar
userRouter.put('/user-avatar', checkPermission({ resource: 'user', action: 'update' }), upload.array('avatar'), userAvatarController);
userRouter.delete('/deteleImage',auth,removeImageFromCloudinary);
userRouter.put('/:id', checkPermission({ resource: 'user', action: 'update' }), updateUserDetails);
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