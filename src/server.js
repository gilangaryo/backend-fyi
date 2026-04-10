// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import compression from "compression";
import hpp from "hpp";
import path from "path";

import uploadRoutes from "./routes/upload.route.js";
import uploadBlogRoutes from "./routes/uploadBlog.route.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { sessionMiddleware } from "./middleware/session.middleware.js";
import authRoutes from "./routes/auth.route.js";
import couponRoutes from "./routes/coupon.route.js";
import wilayahRoutes from "./routes/wilayah.route.js";

import collectionRoutes from "./routes/collection.route.js";
import categoryRoutes from "./routes/category.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import webhookBiteshipRoutes from "./routes/webhookBiteship.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import blogRoute from "./routes/blog.route.js";
import settingRoutes from "./routes/setting.route.js";
import subscribeRoutes from "./routes/subscribe.route.js";
import discountRoutes from "./routes/discount.route.js";
import kainRoutes from "./routes/kain.route.js";
import cartRoutes from "./routes/cart.route.js";
import suggestedRoutes from "./routes/suggested.route.js";
import reportRoutes from "./routes/report.route.js";
import userRoutes from "./routes/user.route.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// 🔒 Security
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginEmbedderPolicy: false,
    }),
);
app.use(hpp());
app.use(compression());

// 📊 Logger
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// 🌍 CORS
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://192.168.1.11:3000",
    "https://app.cobatesting.my.id",
    "http://app.cobatesting.my.id",
    "https://fyicouture.com",
    "https://www.fyicouture.com",
    "https://api.fyicouture.com",
    "https://fyi-couture.vercel.app",
    "http://fyi-frontend-fyi-j71v20-826aea-76-13-193-236.traefik.me",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin))
                return callback(null, true);
            return callback(new Error("CORS not allowed"));
        },
        credentials: true,
    }),
);

// ⚡ Rate Limiting (API only, not webhook)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        status: "error",
        message: "Too many requests",
    },
});

// 📝 Parsers
app.use(express.json());
app.use(cookieParser());

// 🗂 Sessions
app.use(sessionMiddleware);

// 📂 Static files dengan cache headers optimal
const serveStaticWithCache = (folder, maxAge = "365d") => {
    return express.static(path.join(process.cwd(), "uploads", folder), {
        maxAge: maxAge,
        etag: true,
        lastModified: true,
        immutable: true,
        setHeaders: (res, filePath) => {
            if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filePath)) {
                res.setHeader(
                    "Cache-Control",
                    "public, max-age=31536000, immutable",
                );
                res.setHeader("Vary", "Accept-Encoding");
            }
        },
    });
};

// Static routes dengan cache optimal
app.use("/api/uploads/blog", serveStaticWithCache("blog"));
app.use("/api/uploads/collection", serveStaticWithCache("collection"));
app.use("/api/uploads/product", serveStaticWithCache("product"));
app.use("/api/uploads", serveStaticWithCache(""));

// Rate limiting bypass untuk static files & webhooks
app.use((req, res, next) => {
    if (
        req.path.startsWith("/api/uploads") ||
        req.path.startsWith("/api/payment/webhook") ||
        req.path.startsWith("/api/biteship/webhook")
    ) {
        return next(); // BYPASS
    }
    apiLimiter(req, res, next);
});

app.use("/api/upload/blog", requireAuth, requireAdmin, uploadBlogRoutes);
app.use("/api/upload", requireAuth, requireAdmin, uploadRoutes);

// ⚡ Webhook (raw body)
app.use("/api/payment/webhook", webhookRoutes);
app.use("/api/biteship/webhook", webhookBiteshipRoutes);

// 🚀 Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "E-Commerce API is running",
        user: req.user,
    });
});

app.use("/api/blog", blogRoute);
app.use("/api/categories", categoryRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/wilayah", wilayahRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/subscribe", subscribeRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/kain", kainRoutes);

app.get("/restricted", requireAuth, (req, res) => {
    res.json({
        message: "E-Commerce API is running",
        user: req.user,
    });
});

app.use("/api/products", productRoutes);
app.use("/api/suggested-products", suggestedRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", requireAuth, requireAdmin, dashboardRoutes);
app.use("/api/reports", requireAuth, requireAdmin, reportRoutes);
app.use("/api/users", userRoutes);

// 🛑 404
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// 🎯 Error Handler
app.use(errorHandler);

// 🚦 Start
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`E-Commerce API running on port ${PORT}`);
});
