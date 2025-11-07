import { discountRepository } from './discount.repository.js';

export const discountService = {
    async getAllDiscounts() {
        return await discountRepository.findAll();
    },

    async getDiscountById(id) {
        const discount = await discountRepository.findById(id);
        if (!discount) throw new Error('Discount not found');
        return discount;
    },

    async getDiscountByCode(code) {
        const discount = await discountRepository.findByCode(code);
        if (!discount) throw new Error('Discount code not found');
        return discount;
    },

    async createDiscount(payload) {
        // Validasi input
        if (!payload.title || !payload.code || !payload.type || !payload.value || !payload.expiresAt) {
            throw new Error('Missing required fields: title, code, type, value, expiresAt');
        }

        // Validasi type
        if (!['PERCENT', 'VALUE'].includes(payload.type)) {
            throw new Error('Invalid discount type. Must be PERCENT or VALUE');
        }

        // Validasi value
        if (payload.type === 'PERCENT' && (payload.value < 0 || payload.value > 100)) {
            throw new Error('Percentage value must be between 0 and 100');
        }

        if (payload.value <= 0) {
            throw new Error('Value must be greater than 0');
        }

        // Validasi expiration date
        const expiresAt = new Date(payload.expiresAt);
        if (expiresAt <= new Date()) {
            throw new Error('Expiration date must be in the future');
        }

        // Check if code already exists
        const codeExists = await discountRepository.checkCodeExists(payload.code);
        if (codeExists) {
            throw new Error('Discount code already exists');
        }

        return await discountRepository.create(payload);
    },

    async updateDiscount(id, payload) {
        // Check if discount exists
        const existing = await discountRepository.findById(id);
        if (!existing) throw new Error('Discount not found');

        // Validasi type jika diubah
        if (payload.type && !['PERCENT', 'VALUE'].includes(payload.type)) {
            throw new Error('Invalid discount type. Must be PERCENT or VALUE');
        }

        // Validasi value jika diubah
        if (payload.value !== undefined) {
            if (payload.value <= 0) {
                throw new Error('Value must be greater than 0');
            }

            const type = payload.type || existing.type;
            if (type === 'PERCENT' && (payload.value < 0 || payload.value > 100)) {
                throw new Error('Percentage value must be between 0 and 100');
            }
        }

        // Validasi expiration date jika diubah
        if (payload.expiresAt) {
            const expiresAt = new Date(payload.expiresAt);
            if (expiresAt <= new Date()) {
                throw new Error('Expiration date must be in the future');
            }
        }

        // Check if code already exists (exclude current discount)
        if (payload.code) {
            const codeExists = await discountRepository.checkCodeExists(payload.code, id);
            if (codeExists) {
                throw new Error('Discount code already exists');
            }
        }

        return await discountRepository.update(id, payload);
    },

    async deleteDiscount(id) {
        const discount = await discountRepository.findById(id);
        if (!discount) throw new Error('Discount not found');

        // Check if discount is being used in any orders
        if (discount._count && discount._count.orders > 0) {
            throw new Error('Cannot delete discount that has been used in orders');
        }

        return await discountRepository.delete(id);
    },

    async validateDiscount(code, orderTotal) {
        const discount = await discountRepository.findByCode(code);

        if (!discount) {
            return { valid: false, message: 'Invalid discount code' };
        }

        if (!discount.status) {
            return { valid: false, message: 'This discount code is inactive' };
        }

        if (new Date(discount.expiresAt) < new Date()) {
            return { valid: false, message: 'Discount code has expired' };
        }

        if (discount.minimumOrderAmount && orderTotal < discount.minimumOrderAmount) {
            return {
                valid: false,
                message: `Minimum order amount is IDR ${discount.minimumOrderAmount.toLocaleString('id-ID')}`,
            };
        }

        let discountAmount = 0;
        if (discount.type === 'PERCENT') {
            discountAmount = (orderTotal * discount.value) / 100;
        } else {
            discountAmount = parseFloat(discount.value);
        }

        return {
            valid: true,
            discount,
            discountAmount,
            message: 'Discount code applied successfully',
        };
    },


    async applyDiscount(id) {
        return await discountRepository.incrementUsedCount(id);
    },

    async updateStatus(id, status) {
        const discount = await discountRepository.findById(id);
        if (!discount) throw new Error("Discount not found");

        return await discountRepository.updateStatus(id, status);
    }


};