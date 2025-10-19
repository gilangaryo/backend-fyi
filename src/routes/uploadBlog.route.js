import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

const blogUploadDir = path.join(process.cwd(), 'uploads', 'blog')
if (!fs.existsSync(blogUploadDir)) {
    fs.mkdirSync(blogUploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, blogUploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, `blog-${unique}${ext}`)
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

router.post('/', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, message: 'No file uploaded' })

        const oldUrl = req.body.oldUrl
        if (oldUrl) {
            try {
                const filename = path.basename(oldUrl.split('/uploads/blog/')[1] || '')
                if (filename && filename.includes('blog-')) {
                    const oldPath = path.join(blogUploadDir, filename)
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath)
                        console.log('🗑️ Deleted old blog image:', filename)
                    }
                }

            } catch (err) {
                console.warn('⚠️ Failed to delete old file:', err.message)
            }
        }

        const fileUrl = `/uploads/blog/${req.file.filename}`

        res.status(200).json({
            success: true,
            url: fileUrl,
            message: 'Blog image uploaded successfully',
            file: {
                name: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
            },
        })
    } catch (err) {
        console.error('❌ Upload failed:', err)
        res.status(500).json({ success: false, message: err.message })
    }
})

router.delete('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { url } = req.query
        if (!url) return res.status(400).json({ success: false, message: 'No file URL provided' })

        const filename = path.basename(url.split('/uploads/blog/')[1] || '')
        if (!filename || !filename.startsWith('blog-')) {
            return res.status(400).json({ success: false, message: 'Invalid file URL' })
        }

        if (!filename) return res.status(400).json({ success: false, message: 'Invalid file URL' })

        const filePath = path.join(blogUploadDir, filename)

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log('🗑️ Deleted file:', filename)
            return res.status(200).json({ success: true, message: 'File deleted successfully' })
        } else {
            return res.status(404).json({ success: false, message: 'File not found' })
        }
    } catch (err) {
        console.error('❌ Delete failed:', err)
        return res.status(500).json({ success: false, message: err.message })
    }
})

export default router
