import { create } from 'express-handlebars';
import jwt from 'jsonwebtoken';


// Tạo token
export function generateToken(user) {
    return jwt.sign(
        { id: user.id, full_name: user.full_name, email: user.email, role: user.role, created_at: user.created_at},
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

export function generateOTPToken(email) {
    return jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
    );
}

// Verify token
export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}
