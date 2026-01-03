import db from '../utils/db.js';

export function getProductsNearesttoEnd(prod_amount){
  return db('auction')
    .orderBy('end_time', 'asc')
    .limit(prod_amount);
}

export function getProductsMostBids(prod_amount){
  return db('auction as a')
    .leftJoin('auction_bids as ab', 'ab.auction_id', 'a.auction_id')
    .select('a.*', db.raw('COUNT(ab.bid_id) as bid_count'))
    .groupBy('a.auction_id')
    .orderBy('bid_count', 'desc')
    .limit(prod_amount);
}

export function getProductsHighestPrice(prod_amount){
  return db('auction')
    .orderBy('current_price', 'desc')
    .limit(prod_amount);
}

export function getProductsDetailById(id) {
    return db('auction as a')
    .join('categories as c', 'c.id', 'a.category_id')
    .join('user_account as u', 'u.id', 'seller_id')
    .where('a.auction_id', id)
    .select('a.*', 'c.cat_name', 'u.full_name as seller_name', 'u.email as seller_email', 'u.address as seller_address')
    .first()
}

export function getAllProducts(limit, offset) {
    return db('auction').limit(limit).offset(offset);
}

export function getAllProductsPhotos(ids) {
    return db('auction_images').whereIn('auction_id', ids)
}

export function search(keyword, limit, offset) {
  return db('auction')
    .whereRaw(`fts @@ to_tsquery(remove_accents('${keyword}'))`).limit(limit).offset(offset);
}

export function countAll() {
    return db('auction').count('auction_id as count').first();
}

export function countSearch(keyword) {
    return db('auction').whereRaw(`fts @@ to_tsquery(remove_accents('${keyword}'))`).count('auction_id as count').first();
}

export function filterByCategory(category_name) {
    return db('auction')
    .join('categories as c', 'c.id', 'auction.category_id')
    .leftJoin('categories as p', 'p.id', 'c.parent_id')
    .where('c.cat_name', category_name)
    .orWhere('p.cat_name', category_name)
}


export function searchByCategoryKeywordAndSort(category_name, keyword, limit, offset, sortField, sortOrder) {
    let query = db('auction as a')
    .join('categories as c', 'c.id', 'a.category_id')
    .leftJoin('categories as p', 'p.id', 'c.parent_id')
    .select('a.*', 'c.cat_name as category_name', 'p.cat_name as parent_name')
    .limit(limit)
    .offset(offset);

    if (category_name) {
    query.where(function() {
        this.where('c.id', category_name)
            .orWhere('p.id', category_name)
    });
    }

    if (keyword) {
    query.andWhereRaw(`fts @@ to_tsquery(remove_accents(?))`, [keyword]);
    }

    const field = sortField || 'a.created_at';
    const order = sortOrder || 'desc';
    query.orderBy(field, order);

    return query; 
}



export async function countByCategoryKeyword(category_id, keyword) {
  const query = db('auction as a')
    .join('categories as c', 'c.id', 'a.category_id')
    .leftJoin('categories as p', 'p.id', 'c.parent_id');

  if (category_id) {
    query.where(function() {
      this.where('c.id', category_id)
          .orWhere('p.id', category_id);
    });
  }

  if (keyword) {
    query.andWhereRaw(`fts @@ to_tsquery(remove_accents(?))`, [keyword]);
  }

  const result = await query.count('a.auction_id as count').first();

  return parseInt(result.count, 10); // trả về số nguyên
}


export function getProductBiddingHistory(auction_id) {
    return db('auction_bids as ab')
    .join('user_account as u', 'u.id', 'bidder_id')
    .select('ab.*', 'u.full_name as bidder_name', 'u.email as bidder_email', 'u.address as bidder_address')
    .where('auction_id', auction_id)
    .orderBy('ab.created_at', 'desc');
}


export function getAllProductComments(id) {
  return db('comments').join('user_account as u', 'u.id', 'comments.user_id').select('comments.*', 'u.full_name as user_name').where('auction_id', id);
}

export function countProductComments(id) {
  return db('comments').where('auction_id', id).count('comment_id as count').first()
}

export function addProductComments(comment) {
  return db('comments').insert(comment);
}

export function addProduct(product) {
  return db('auction').insert(product).returning('auction_id');
}

export function addProductImages(images) {
  return db('auction_images').insert(images);
}

// SELECT 
//     a.auction_id AS ID,
//     a.name AS Name,
//     c.cat_name AS Category,
//     u.full_name AS Seller,
//     CASE 
//         WHEN b_max_winner.max_bid IS NULL THEN a.starting_price
//         ELSE LEAST(
//             b_max_winner.max_bid,
//             COALESCE(b_second.max_bid + a.bid_step, a.starting_price)
//         )
//     END AS Current_Price,
//     a.status AS Status
// FROM auction a
// JOIN user_account u ON a.seller_id = u.id
// LEFT JOIN categories c ON a.category_id = c.id
// -- Lấy max bid của winner
// LEFT JOIN (
//     SELECT auction_id, MAX(max_bid) AS max_bid
//     FROM auction_bids
//     WHERE is_winning = TRUE
//     GROUP BY auction_id
// ) b_max_winner ON b_max_winner.auction_id = a.auction_id
// -- Lấy max bid của người thứ 2 (không phải winner)
// LEFT JOIN (
//     SELECT auction_id, MAX(max_bid) AS max_bid
//     FROM auction_bids
//     WHERE is_winning = FALSE
//     GROUP BY auction_id
// ) b_second ON b_second.auction_id = a.auction_id
// ORDER BY a.auction_id;
export function getAllAuctionsForAdmin(limit, offset) {
    return db('auction as a')
        .join('user_account as u', 'a.seller_id', 'u.id')       // Thông tin người bán
        .leftJoin('categories as c', 'a.category_id', 'c.id')   // Thông tin danh mục
        .select(
            'a.auction_id AS ID',
            'a.name AS Name',
            'c.cat_name AS Category',
            'u.full_name AS Seller',
            'a.created_at AS Created_At',
            db.raw(`
                CASE 
                    WHEN a.current_price = 0 OR a.current_price IS NULL 
                    THEN a.starting_price
                    ELSE a.current_price
                END AS "Current_Price"
            `),
            'a.status AS Status',
            'a.winner_bidder_id AS Winner'
        )
        .orderBy('a.auction_id')
        .limit(limit)
        .offset(offset);
}


export function deleteAuctionById(id) {
    return db('auction').where('auction_id', id).del();
}

export function getTop1Bidders(auction_id) {
    return db('auction as a')
    .join('user_account as u', 'u.id', 'a.winner_bidder_id')
    .where('a.auction_id', auction_id)
    .select('u.full_name as bidder_name', 'u.rating_score as bidder_reviews')
    .first();
}


{/* <div class="top-bidder-card p-3 mb-4 border rounded bg-light">
                    <h6 class="mb-2">Top Bidder</h6>
                    {{#if product.top_bidder}}
                    <div class="d-flex align-items-center">
                        <span class="fw-semibold me-2">{{product.top_bidder.name}}</span>
                        <small class="text-muted">({{product.top_bidder.reviews}} reviews)</small>
                        <span class="ms-auto fw-bold text-success">{{product.top_bidder.amount}} VNĐ</span>
                    </div>
                    {{else}}
                    <p class="text-muted mb-0">No bids yet</p>
                    {{/if}}
                </div> */}