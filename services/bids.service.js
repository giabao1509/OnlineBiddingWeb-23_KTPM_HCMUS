import db from '../utils/db.js';

export function getBidsByAuctionId(auctionId) {
    return db('auction_bids')
        .where('auction_id', auctionId)
        .orderBy('bid_amount', 'desc');
}   

export function placeBid(bid) {
    return db('auction_bids').insert(bid);
}