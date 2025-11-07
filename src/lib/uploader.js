import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function deleteFileFromServer(fileUrl) {
    if (!fileUrl) return
    const filename = fileUrl.split('/uploads/')[1]
    if (!filename) return

    const filePath = path.join(__dirname, '..', 'uploads', filename)
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log('🗑️ Deleted local file:', filename)
    }
}
