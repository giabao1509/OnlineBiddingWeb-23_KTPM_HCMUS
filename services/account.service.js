import db from '../utils/db.js';




export function addAccount(account) {
    return db('user_account').insert(account).returning('*');
}

export function addOTP(otp) {
    return db('otp').insert(otp);
}


export function getOTP(email) {
    return db('otp').where('email', email).first();
}

export function deleteOTP(email) {
    return db('otp').where('email', email).del();
}

export function getAccountByEmail(email) {
    return db('user_account').where('email', email).first();
}


export function updatePassword(email, newPassword) {
    return db('user_account').where('email', email).update('password', newPassword);
}


export function getAccountByGoogleId(googleId) {
    return db('user_account').where({ googleId }).first();
}

export function getAllUsers(limit = 5, offset = 0) {
    return db('user_account').select('id', 'email', 'full_name', 'role', 'created_at', 'status')
    .whereNot('role', 2)
    .limit(limit)
    .offset(offset)
    .orderBy('id', 'asc');
}   

export function linkGoogleId(userId, googleId) {
    return db('user_account')
        .where({ id: userId })
        .update({ googleId });
}


export function updateAccount(id, updatedData) {
    return db('user_account')
        .where('id', id)
        .update(updatedData);
}   

export function countAllUsers() {
    return db('user_account')
        .whereNot('role', 2)
        .count('id as count')
        .first();
}


export function upgradeToSeller(customerId) {
    return db('user_account')
        .where('id', customerId)
        .update({ role: 1 });
}