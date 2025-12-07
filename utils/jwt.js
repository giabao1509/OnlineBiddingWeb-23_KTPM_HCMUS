import jwt from 'jsonwebtoken';


// Tạo token
export function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
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
