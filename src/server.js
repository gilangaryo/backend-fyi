// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import hpp from 'hpp';
import path from 'path';

import uploadRoutes from './routes/upload.route.js'
import uploadBlogRoutes from './routes/uploadBlog.route.js'

import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { sessionMiddleware } from './middleware/session.middleware.js';
import authRoutes from './routes/auth.route.js';
import couponRoutes from './routes/coupon.route.js';
import wilayahRoutes from './routes/wilayah.route.js'

import collectionRoutes from './routes/collection.route.js';
import categoryRoutes from './routes/category.route.js';
import productRoutes from './routes/product.route.js';
import orderRoutes from './routes/order.route.js';
import webhookRoutes from './routes/webhook.route.js';
import dashboardRoutes from './routes/dashboard.route.js';
// import userRoutes from './routes/user.route.js';
import blogRoute from "./routes/blog.route.js";
import settingRoutes from "./routes/setting.route.js";
import subscribeRoutes from "./routes/subscribe.route.js";
import discountRoutes from "./routes/discount.route.js";
import kainRoutes from "./routes/kain.route.js";
import cartRoutes from "./routes/cart.route.js";
import suggestedRoutes from "./routes/suggested.route.js";
import reportRoutes from "./routes/report.route.js";
import userRoutes from './routes/user.route.js';


dotenv.config();

const app = express();
app.set('trust proxy', 1);

// 🔒 Security
app.use(helmet());
app.use(hpp());
app.use(compression());

// 📊 Logger
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// 🌍 CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://192.168.1.11:3000',
    'https://app.cobatesting.my.id',
    'http://app.cobatesting.my.id',

    // production domains
    'https://fyicouture.com',
    'https://www.fyicouture.com',
    'https://api.fyicouture.com',
    'https://fyi-couture.vercel.app'
];
app.use(cors({

    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS not allowed'));
    },
    credentials: true,
}));

// ⚡ Rate Limiting (API only, not webhook)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
        status: 'error',
        message: 'Too many requests'
    },
});
app.use('/api/', apiLimiter);

// 📝 Parsers
app.use(express.json());
app.use(cookieParser());

// 🗂 Sessions
app.use(sessionMiddleware);

// 📂 Static files (uploads)
app.use('/api/uploads/blog', express.static(path.join(process.cwd(), 'uploads', 'blog')))
app.use('/api/upload/blog', requireAuth, requireAdmin, uploadBlogRoutes)
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/uploads/collection', express.static(path.join(process.cwd(), 'uploads', 'collection')));
app.use('/api/upload', requireAuth, requireAdmin, uploadRoutes)



// ⚡ Webhook (raw body)
app.use('/api/payment/webhook', webhookRoutes);

// 🚀 Routes
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
    res.json({
        message: 'E-Commerce API is running',
        user: req.user
    });
});

app.use("/api/blog", blogRoute);
app.use('/api/categories', categoryRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/wilayah', wilayahRoutes)
app.use('/api/setting', settingRoutes)
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/kain', kainRoutes);



app.get('/restricted', requireAuth, (req, res) => {
    res.json({
        message: 'E-Commerce API is running',
        user: req.user
    });
});

// app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suggested-products', suggestedRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', requireAuth, requireAdmin, dashboardRoutes);
app.use("/api/reports", requireAuth, requireAdmin, reportRoutes);
app.use('/api/users', userRoutes);

// 🛑 404
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// 🎯 Error Handler
app.use(errorHandler);

// 🚦 Start
const PORT = process.env.PORT || 4300;
app.listen(PORT, () => {
    console.log(`E-Commerce API running `);
});
