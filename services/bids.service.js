import db from '../utils/db.js';

export function getBidsByAuctionId(auctionId) {
    return db('auction_bids')
        .where('auction_id', auctionId)
        .orderBy('bid_amount', 'desc');
}   

export function getUserInfoByBidId(bidId) {
    return db('auction_bids as ab')
        .join('user_account as ua', 'ab.bidder_id', 'ua.id')
        .where('ab.bid_id', bidId)
        .select('ua.full_name', 'ua.email');
}

export function placeBid(bid) {
    return db('auction_bids').insert(bid).returning('bid_id');
}

export function countBidsByAuctionId(auction_id) {
    return db('auction_bids')
        .where('auction_id', auction_id)
        .count('bid_id as count')
        .first();
}


export function rejectBid(bidId, auctionId) {
    return db('auction_bids')
  .where('bid_id', bidId)
  .andWhere('auction_id', auctionId)
  .update({ is_rejected: true });
}

export function updateTopBidder(auctionId, auctionBidId) {
    return db.raw('SELECT recalc_auction_price(?, ?)', [auctionId, auctionBidId])
}