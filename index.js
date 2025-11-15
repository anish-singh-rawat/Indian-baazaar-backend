import express from 'express';
import './config/patchExpressAsync.js';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser'
import helmet from 'helmet';
import connectDB from './config/connectDb.js';
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js';
import productRouter from './route/product.route.js';
import cartRouter from './route/cart.route.js';
import myListRouter from './route/mylist.route.js';
import addressRouter from './route/address.route.js';
import homeSlidesRouter from './route/homeSlides.route.js';
import bannerV1Router from './route/bannerV1.route.js';
import bannerList2Router from './route/bannerList2.route.js';
import blogRouter from './route/blog.route.js';
import orderRouter from './route/order.route.js';
import notificationRouter from './route/notification.route.js';
import permissionRouter from './route/permission.route.js';
import shipRocketAddressRoute from './route/shiprocket.address.route.js';
import ShipRocketOrderRoute from './route/shiprocket.order.route.js';
import shiprocketTrackingRoute from './route/shiprocket.tracking.route.js';

const app = express();
app.use(cors({
  origin: ["http://localhost:5173","http://localhost:5174"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));



app.use(express.json())
app.use(cookieParser())
app.use(helmet({
    crossOriginResourcePolicy: false
}))

try {
    app.get("/", (request, response) => {
        response.json({
            message: "Server is running " + process.env.PORT,
            error: false,
            success: true,
            server : "indianbaazaar"
        })
    })
    
} catch (error) {
    console.error("Error occurred:", error);
    response.status(500).json({
        message: "Internal Server Error",
        error: true,
        success: false,
        server : "indianbaazaar",
        serverError : error.message || error
    });
}


app.use('/api/user',userRouter)
app.use('/api/category',categoryRouter)
app.use('/api/product',productRouter);
app.use("/api/cart",cartRouter)
app.use("/api/myList",myListRouter)
app.use("/api/address",addressRouter)
app.use("/api/homeSlides",homeSlidesRouter)
app.use("/api/bannerV1",bannerV1Router)
app.use("/api/bannerList2",bannerList2Router)
app.use("/api/blog",blogRouter)
app.use("/api/order",orderRouter)
app.use('/api/notification', notificationRouter)
app.use('/api/permission', permissionRouter)
app.use('/api/shiprocket/pick-up-address',  shipRocketAddressRoute);
app.use('/api/shiprocket/package',  ShipRocketOrderRoute);
app.use('/api/shiprocket', shiprocketTrackingRoute);

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const status = err?.status || 500;
    res.status(status).json({
        message: err?.message || 'Internal Server Error',
        error: true,
        success: false,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
});

connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running http://localhost:${process.env.PORT}`);
    })
})