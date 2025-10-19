import express from 'express'
import fetch from 'node-fetch'

const router = express.Router()

// Base API URL
const EMSIFA_BASE = 'https://emsifa.github.io/api-wilayah-indonesia/api'
const BITESHIP_BASE = 'https://api.biteship.com/v1/maps/areas'

// In-memory cache (simple Map, bisa ganti ke Redis nanti)
const cache = new Map()
const CACHE_TTL = 1000 * 60 * 60 // 1 jam

// Utility untuk cache
const getCache = (key) => {
    const item = cache.get(key)
    if (!item) return null
    if (Date.now() > item.expiry) {
        cache.delete(key)
        return null
    }
    return item.data
}

const setCache = (key, data) => {
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL })
}

// ============================================================
// 🔹 GET /api/wilayah/provinces
router.get('/provinces', async (req, res) => {
    try {
        const cacheKey = 'provinces'
        const cached = getCache(cacheKey)
        if (cached) return res.json(cached)

        const resp = await fetch(`${EMSIFA_BASE}/provinces.json`)
        const data = await resp.json()
        setCache(cacheKey, data)
        res.json(data)
    } catch (err) {
        console.error('❌ Error fetching provinces:', err)
        res.status(500).json({ message: 'Failed to fetch provinces' })
    }
})

// 🔹 GET /api/wilayah/cities/:provinceId
router.get('/cities/:provinceId', async (req, res) => {
    try {
        const { provinceId } = req.params
        const cacheKey = `cities-${provinceId}`
        const cached = getCache(cacheKey)
        if (cached) return res.json(cached)

        const resp = await fetch(`${EMSIFA_BASE}/regencies/${provinceId}.json`)
        const data = await resp.json()
        setCache(cacheKey, data)
        res.json(data)
    } catch (err) {
        console.error('❌ Error fetching cities:', err)
        res.status(500).json({ message: 'Failed to fetch cities' })
    }
})

// 🔹 GET /api/wilayah/districts/:cityId
router.get('/districts/:cityId', async (req, res) => {
    try {
        const { cityId } = req.params
        const cacheKey = `districts-${cityId}`
        const cached = getCache(cacheKey)
        if (cached) return res.json(cached)

        const resp = await fetch(`${EMSIFA_BASE}/districts/${cityId}.json`)
        const data = await resp.json()
        setCache(cacheKey, data)
        res.json(data)
    } catch (err) {
        console.error('❌ Error fetching districts:', err)
        res.status(500).json({ message: 'Failed to fetch districts' })
    }
})

// 🔹 GET /api/wilayah/villages/:districtId
router.get('/villages/:districtId', async (req, res) => {
    try {
        const { districtId } = req.params
        const cacheKey = `villages-${districtId}`
        const cached = getCache(cacheKey)
        if (cached) return res.json(cached)

        const resp = await fetch(`${EMSIFA_BASE}/villages/${districtId}.json`)
        const data = await resp.json()
        setCache(cacheKey, data)
        res.json(data)
    } catch (err) {
        console.error('❌ Error fetching villages:', err)
        res.status(500).json({ message: 'Failed to fetch villages' })
    }
})

// ============================================================
// 🔹 GET /api/wilayah/postal?input=pacitan
router.get('/postal', async (req, res) => {
    const { input } = req.query
    if (!input) {
        return res.status(400).json({ message: 'Missing ?input=' })
    }

    const cacheKey = `postal-${input.toLowerCase()}`
    const cached = getCache(cacheKey)
    if (cached) return res.json(cached)

    try {
        const resp = await fetch(
            `${BITESHIP_BASE}?countries=ID&input=${encodeURIComponent(input)}&type=single`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!resp.ok) {
            const text = await resp.text()
            console.error('❌ Biteship error:', text)
            return res.status(resp.status).json({ message: 'Biteship fetch failed' })
        }

        const data = await resp.json()
        setCache(cacheKey, data)
        res.json(data)
    } catch (err) {
        console.error('❌ Error fetching postal code:', err)
        res.status(500).json({ message: 'Failed to fetch postal code' })
    }
})

// ============================================================
export default router
