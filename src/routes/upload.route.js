import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router()

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, `product-${unique}${ext}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowed.includes(file.mimetype)) {
            const error = new Error('Only JPG, PNG, WEBP files are allowed')
            error.status = 400
            return cb(error)
        }
        cb(null, true)
    },
})

router.post('/', requireAuth, requireAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const fileUrl = `/uploads/product/${req.file.filename}`

    res.json({
        success: true,
        url: fileUrl,
        message: 'File uploaded successfully',
        file: {
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
        },
    })
})

export default router
