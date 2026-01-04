import db from '../utils/db.js';


// //Lấy thông tin đơn hàng
//Lấy thông tin đơn hàng
// SELECT o.id, a.name, a.end_time, a.current_price, ae.image_url, a.seller_id, a.winner_bidder_id
// from orders o
// join auction a on a.auction_id = o.auction_id
// join auction_images ae on ae.auction_id = a.auction_id 
// Where ae.is_thumbnail = TRUE

export function getOrderDetailsById(orderId) {
    return db('orders as o')
        .join('auction as a', 'a.auction_id', 'o.auction_id')
        .join('auction_images as ae', function() {  
            this.on('ae.auction_id', '=', 'a.auction_id').andOn('ae.is_thumbnail', '=', db.raw('TRUE'));
        })
        .select(
            'o.id',
            'a.auction_id',
            'a.name',
            'a.current_price AS final_price',
            'o.created_at AS end_time',
            'ae.image_url',
            'a.seller_id',
            'a.winner_bidder_id',
            'o.status'
        )
        .where('o.id', orderId)
        .first();
}

// //Lấy thông tin bidder
// SELECT
//     b.full_name AS bidder_name,
//     b.rating_score,
//     COUNT(*) AS bidder_reviews
// FROM orders o
// JOIN auction a ON a.auction_id = o.auction_id
// JOIN user_account b ON b.id = a.winner_bidder_id
// JOIN user_ratings r ON r.reviewee_id = b.id
// GROUP BY
//     b.id,
//     b.full_name,
//     b.rating_score;


export function getBidderInfoByOrderId(orderId) {
    return db('orders as o')
        .join('auction as a', 'a.auction_id', 'o.auction_id')
        .join('user_account as b', 'b.id', 'a.winner_bidder_id')
        .join('user_ratings as r', 'r.reviewee_id', 'b.id')
        .select(
            'b.full_name AS bidder_name',
            'b.rating_score',
            db.raw('COUNT(*) AS bidder_reviews')
        )
        .where('o.id', orderId)
        .groupBy('b.id', 'b.full_name', 'b.rating_score')
        .first();
}


export function getSellerInfoByOrderId(orderId) {
    return db('orders as o')
        .join('auction as a', 'a.auction_id', 'o.auction_id')
        .join('user_account as b', 'b.id', 'a.seller_id')
        .join('user_ratings as r', 'r.reviewee_id', 'b.id')
        .select(
            'b.full_name AS seller_name',
            'b.rating_score',
            db.raw('COUNT(*) AS seller_reviews')
        )
        .where('o.id', orderId)
        .groupBy('b.id', 'b.full_name', 'b.rating_score')
        .first();
}


export function completeOrderPayment(orderPayment) {
    return db('order_payment').insert(orderPayment);
}

export function updateOrderStatus(orderId, status) {
    return db('orders')
        .where('id', orderId)
        .update({ status });
}


export function getOrderPaymentByOrderId(orderId) {
    return db('order_payment')
        .where('id', orderId)
        .first();
}


export function completeOrderShipping(orderShipping) {
    return db('order_shipping').insert(orderShipping);
}

export function getOrderShippingByOrderId(orderId) {
    return db('order_shipping')
        .where('id', orderId)
        .first();
}

export function submitOrderRating(rating) {
    return db('user_ratings').insert(rating).onConflict(['order_id', 'reviewer_id']).merge();
}

export function getOrderRating(orderId, userId) {
    return db('user_ratings')
        .where('order_id', orderId)
        .andWhere('reviewer_id', userId)
        .first();
}

export function updateOrderRating(orderId, reviewerId, updatedData) {
    return db('user_ratings')
        .where('order_id', orderId)
        .andWhere('reviewer_id', reviewerId)
        .update(updatedData);
}

export function sendMessage(message) {
    return db('messages').insert(message);
}

export function getMessagesByOrderId(orderId) {
    return db('messages')
        .where('order_id', orderId)
        .orderBy('created_at', 'asc');
}