import db from '../utils/db.js';


export function getAllUpgradeRequests(limit = 5, offset = 0) {
    return db('upgrade_request')
    .join('user_account', 'upgrade_request.customer_id', '=', 'user_account.id')
    .whereRaw("upgrade_request.created_at >= NOW() - INTERVAL '7 days'")
    .andWhere('upgrade_request.status', 'Pending')
    .select('upgrade_request.id', 'upgrade_request.customer_id', 'user_account.email', 'user_account.full_name', 'user_account.role', 'upgrade_request.created_at')
    .limit(limit)
    .offset(offset)
    .orderBy('upgrade_request.id', 'asc');
}

export function updateUpgradeRequestStatus(id, status) {
    return db('upgrade_request')
        .where('id', id)
        .update({ status });
}

export function countAllUpgradeRequests() {
    return db('upgrade_request')
    .whereRaw("upgrade_request.created_at >= NOW() - INTERVAL '7 days'")
    .andWhere('upgrade_request.status', 'Pending')
    .count('id as count')
    .first();
}

export function createUpgradeRequest(request) {
    return db('upgrade_request').insert(request);
}