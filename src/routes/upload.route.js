import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

const baseDir = path.join(process.cwd(), 'uploads')

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        const folder = req.query.folder || 'misc';
        const dir = path.join(baseDir, folder);
        ensureDir(dir);
        cb(null, dir);
    },
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

router.delete('/', requireAuth, requireAdmin, (req, res) => {
    const folder = req.query.folder || 'misc'
    const filename = req.query.filename

    if (!filename) {
        return res.status(400).json({ success: false, message: 'Filename is required' })
    }

    const filePath = path.join(baseDir, folder, filename)

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' })
    }

    try {
        fs.unlinkSync(filePath)
        return res.json({
            success: true,
            message: 'File deleted successfully',
            deleted: `/uploads/${folder}/${filename}`,
        })
    } catch (err) {
        console.error('Delete error:', err)
        return res.status(500).json({ success: false, message: 'Failed to delete file' })
    }
})


export default router
