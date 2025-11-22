import express from 'express';
import './config/patchExpressAsync.js';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser'
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { redis } from './config/redisClient.js';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
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
import adminRouter from './route/admin.route.js';
import retailerRouter from './route/retailer.route.js';
import { razorpayWebhook } from './controllers/payment.controller.js';

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://indianbaazaar.com",
  "https://www.indianbaazaar.com",
  "https://admin.indianbaazaar.com",
  "https://www.admin.indianbaazaar.com",
  "https://vivid-seats-assignment.vercel.app"
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression()); 
app.use(morgan('combined'));
app.use(mongoSanitize());
app.use(xss()); 
app.use(hpp()); 

app.use(express.json({ limit: '10mb' })); 
app.use(cookieParser())

const checkBlockedIP = async (req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.ip || req.socket?.remoteAddress;
  try {
    const isBlocked = await redis.get(`blocked:${ip}`);
    if (isBlocked) {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Your IP address has been blocked due to suspicious activity.'
      });
    }
  } catch (error) {
    console.error('Error checking blocked IP:', error);
  }
  next();
};

app.use(checkBlockedIP);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: true,
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,

 handler: async (req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.ip || req.socket?.remoteAddress;
  try {
    await redis.set(`blocked:${ip}`, 'true', 'EX', 3600); 
  } catch (error) {
    console.error('Error blocking IP:', error);
  }

  return res.status(429).json({
    error: true,
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  });
}

});

app.use(limiter);


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
app.use('/api/admin', adminRouter);
app.use('/api/retailer', retailerRouter);
app.post('/api/payment/webhook', express.json({ type: '*/*' }), razorpayWebhook);

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