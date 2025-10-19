import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository.js';

export const AuthService = {
    async register({ name, email, password }) {
        const existing = await AuthRepository.findByEmail(email);
        if (existing) throw new Error('Email already registered');

        const hashed = await bcrypt.hash(password, 10);

        const user = await AuthRepository.createUser({
            name,
            email,
            password: hashed,
            role: 'USER',
        });

        const token = generateToken(user);
        await AuthRepository.updateRefreshToken(user.id, token);

        return { user, token };
    },

    async login({ email, password }) {
        const user = await AuthRepository.findByEmail(email);
        if (!user) throw new Error('Invalid email');

        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new Error('Invalid credentials');

        const token = generateToken(user);
        await AuthRepository.updateRefreshToken(user.id, token);

        return { user, token };
    },
};

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1d',

        }
    );
}
