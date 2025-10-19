import multer from 'multer'
import fs from 'fs'
import path from 'path'

export const createUploader = (prefix, destination = 'uploads') =>
    multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                const fullPath = path.join(process.cwd(), destination)
                if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true })
                cb(null, fullPath)
            },
            filename: (req, file, cb) => {
                const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
                cb(null, `${prefix}-${unique}${path.extname(file.originalname)}`)
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
    })
