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

export function linkGoogleId(userId, googleId) {
    return db('user_account')
        .where({ id: userId })
        .update({ googleId });
}