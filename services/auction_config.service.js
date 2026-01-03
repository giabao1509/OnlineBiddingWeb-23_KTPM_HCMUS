import db from '../utils/db.js';

export function getAuctionConfig() {
    return db('auction_config').first();
}

export function updateAuctionConfig(config) {
    return db('auction_config')
        .update(config);
}

export function initializeAuctionConfig(config) {
    return db('auction_config').insert(config);
}