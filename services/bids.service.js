import db from '../utils/db.js';

export function getBidsByAuctionId(auctionId) {
    return db('auction_bids')
        .where('auction_id', auctionId)
        .orderBy('bid_amount', 'desc');
}   

export function placeBid(bid) {
    return db('auction_bids').insert(bid).returning('bid_id');
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