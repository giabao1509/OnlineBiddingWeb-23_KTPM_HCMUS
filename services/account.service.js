import db from '../utils/db.js';




export function addAccount(account) {
    return db('user_account').insert(account);
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