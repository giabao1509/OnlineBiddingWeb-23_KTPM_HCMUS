import db from '../utils/db.js';


export function getProductsDetailById(id) {
    return db('auction as a')
    .join('categories as c', 'c.id', 'a.category_id')
    .join('user_account as u', 'u.id', 'seller_id')
    .leftJoin('orders as o', 'o.auction_id', 'a.auction_id')
    .where('a.auction_id', id)
    .select('a.*', 'c.cat_name', 'u.full_name as seller_name', 'u.email as seller_email', 'u.address as seller_address', 'o.id as order_id')
    .first()
}

export function getAllProducts(limit, offset) {
    return db('auction').limit(limit).offset(offset);
}



export function getAllRelatedProducts(auction_id, category_id) {
    return db('auction as a')
        .join('categories as c', 'c.id', 'a.category_id')
        .leftJoin('categories as p', 'p.id', 'c.parent_id')
        .leftJoin('auction_images as ai', function () {
            this.on('ai.auction_id', '=', 'a.auction_id')
                .andOn('ai.is_thumbnail', '=', db.raw('true'));
        })
        .join('user_account as s', 's.id', 'a.seller_id')
        .leftJoin('user_account as b', 'b.id', 'a.winner_bidder_id')
        .select(
            'a.name',
            'a.end_time',
            'a.auction_id',
            'ai.image_url',
            's.full_name as seller_name',
            'b.full_name as top_bidder_name',
            'c.cat_name as category_name',
            'p.cat_name as parent_name',
            db.raw(`
                CASE 
                    WHEN a.current_price IS NULL OR a.current_price = 0 
                    THEN a.starting_price 
                    ELSE a.current_price 
                END AS "currentPrice"
            `),
            db.raw(`
                (SELECT COUNT(*) 
                 FROM auction_bids ab 
                 WHERE ab.auction_id = a.auction_id
                ) AS bid_count
            `)
        )
        .where('a.category_id', category_id)
        .whereNot('a.auction_id', auction_id)
        .limit(4);
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

export function updateProduct(id, updatedData) {
    return db('auction')
        .where('auction_id', id)
        .update(updatedData);
}

export function searchByCategoryKeywordAndSort(category_name, keyword, limit, offset, sortField, sortOrder) {
    let query = db('auction as a')
        .join('categories as c', 'c.id', 'a.category_id')
        .leftJoin('categories as p', 'p.id', 'c.parent_id')
        .leftJoin('auction_images as ai', function() {
            this.on('ai.auction_id', '=', 'a.auction_id')
                .andOn('ai.is_thumbnail', '=', db.raw('true'));
        })
        .join('user_account as s', 's.id', 'a.seller_id')
        .leftJoin('user_account as b', 'b.id', 'a.winner_bidder_id')
        .select(
            'a.name',
            'a.created_at',
            'a.end_time',          
            'a.auction_id',
            'ai.image_url',
            's.full_name as seller_name',
            'b.full_name as top_bidder_name',
            'c.cat_name as category_name',
            'p.cat_name as parent_name',
            db.raw('CASE WHEN a.current_price IS NULL OR a.current_price = 0 THEN a.starting_price ELSE a.current_price END as "currentPrice"'),
            db.raw('(SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as bid_count')
        )
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

    const order = sortOrder || 'desc';
    if (sortField === 'sort_price') {
        query.orderByRaw('CASE WHEN a.current_price IS NULL OR a.current_price = 0 THEN a.starting_price ELSE a.current_price END ' + order);
    } else {
        const field = sortField || 'a.created_at';
        query.orderBy(field, order);
    }

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

  return parseInt(result.count, 10); 
}


export function getProductBiddingHistory(auction_id) {
    return db('auction_bids as ab')
    .join('user_account as u', 'u.id', 'bidder_id')
    .select('ab.*', 'u.id', 'u.full_name as bidder_name', 'u.email as bidder_email', 'u.address as bidder_address')
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


export function getAllAuctionsForAdmin(limit, offset) {
    return db('auction as a')
        .join('user_account as u', 'a.seller_id', 'u.id')       
        .leftJoin('categories as c', 'a.category_id', 'c.id') 
        .leftJoin('auction_images as ai', function() {
            this.on('ai.auction_id', '=', 'a.auction_id')
                .andOn('ai.is_thumbnail', '=', db.raw('true'));
        })
        .select(
            'a.auction_id AS ID',
            'ai.image_url',
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


export function addToWatchList(watchlistItem) {
    return db('watch_list').insert(watchlistItem);
}


export function updateProductDescription(auction_id, newDescription) {
    return db('auction')
        .where('auction_id', auction_id)
        .update({ description: newDescription });
}

export function getWatchListByUserId(user_id, limit, offset) {
    return db('watch_list as wl')
    .join('auction as a', 'a.auction_id', 'wl.auction_id')
    .leftJoin('auction_images as ai', function() {
        this.on('ai.auction_id', '=', 'a.auction_id').andOn('ai.is_thumbnail', '=', db.raw('true'));
    })
    .where('wl.user_id', user_id)
    .select('a.*', 'ai.image_url')
    .limit(limit)
    .offset(offset)
    .orderBy('wl.created_at', 'desc');
}

export function countAllWatchListItems(user_id) {
    return db('watch_list')
    .where('user_id', user_id)
    .count('id as count')
    .first();
}

export function getWonAuctionsByUserId(user_id, limit, offset) {
    return db('auction as a')
    .leftJoin('auction_images as ai', function() {
        this.on('ai.auction_id', '=', 'a.auction_id').andOn('ai.is_thumbnail', '=', db.raw('true'));
    })
    .join('orders as o', 'o.auction_id', 'a.auction_id')
    .where('a.winner_bidder_id', user_id)
    .andWhere('a.status', 'Completed')
    .select('a.*', 'ai.image_url', 'o.id as order_id')
    .limit(limit)
    .offset(offset)
    .orderBy('a.end_time', 'desc');
}

export function countAllWonAuctions(user_id) {
    return db('auction as a')
    .join('orders as o', 'o.auction_id', 'a.auction_id')
    .where('a.winner_bidder_id', user_id)
    .andWhere('a.status', 'Completed')
    .count('a.auction_id as count')
    .first();
}


export function getBiddingAuctionsByUserId(userId, limit, offset) {
    return db('auction as a')
        .join('auction_bids as ab', 'ab.auction_id', 'a.auction_id')
        .leftJoin('auction_images as ai', function () {
            this.on('ai.auction_id', '=', 'a.auction_id')
                .andOn('ai.is_thumbnail', '=', db.raw('true'));
        })
        .where('ab.bidder_id', userId)
        .andWhere('a.status', 'Bidding')
        .select(
            'a.auction_id',
            'a.name',
            'a.current_price as currentBid',
            'ai.image_url as image',
            db.raw('MAX(ab.amount) as yourBid'),
            db.raw(`
                CASE 
                    WHEN ? = a.winner_bidder_id THEN true
                    ELSE false
                END as "isWinning"
            `, [userId]),
            db.raw('MAX(ab.created_at) as last_bid_time')
        )
        .groupBy(
            'a.auction_id',
            'a.name',
            'a.current_price',
            'ai.image_url'
        )
        .orderByRaw('last_bid_time DESC')
        .limit(limit)
        .offset(offset);
}



export function countAllBiddingAuctions(user_id) {
    return db('auction as a')
    .join('auction_bids as ab', 'ab.auction_id', 'a.auction_id')
    .where('ab.bidder_id', user_id)
    .andWhere('a.status', 'Bidding')
    .countDistinct('a.auction_id as count')
    .first();
}


export function getActiveAuctionsBySellerId(seller_id, limit, offset) {
    return db('auction as a')
    .leftJoin('auction_images as ai', function() {
        this.on('ai.auction_id', '=', 'a.auction_id').andOn('ai.is_thumbnail', '=', db.raw('true'));
    })
    .where('a.seller_id', seller_id)
    .andWhere('a.status', 'Bidding')
    .select(
      'a.*', 
      'ai.image_url', 
      db.raw(`(
        SELECT COUNT(*)
        FROM auction_bids ab
        WHERE ab.auction_id = a.auction_id
      ) as total_bids`)
      )
    .limit(limit)
    .offset(offset)
    .orderBy('a.created_at', 'desc');
}

export function countAllActiveAuctionsBySeller(seller_id) {
    return db('auction')
    .where('seller_id', seller_id)
    .andWhere('status', 'Bidding')
    .count('auction_id as count')
    .first();
}

export function getSoldItemsBySellerId(seller_id, limit, offset) {
    return db('auction as a')
    .leftJoin('auction_images as ai', function() {
        this.on('ai.auction_id', '=', 'a.auction_id').andOn('ai.is_thumbnail', '=', db.raw('true'));
    })
    .join('user_account as u', 'u.id', 'a.winner_bidder_id')
    .where('a.seller_id', seller_id)
    .andWhere('a.status', 'Completed')
    .select('a.*', 'ai.image_url', 'u.full_name as buyer_name')
    .limit(limit)
    .offset(offset)
    .orderBy('a.end_time', 'desc');
}

export function countAllSoldItemsBySeller(seller_id) {
    return db('auction')
    .where('seller_id', seller_id)
    .andWhere('status', 'Completed')
    .count('auction_id as count')
    .first();
}

export function removeFromWatchList(user_id, auction_id) {
    return db('watch_list')
    .where('user_id', user_id)
    .andWhere('auction_id', auction_id)
    .del();
}


export function getTop5EndingSoonAuctions() {
    return db('auction as a')
        .join('categories as c', 'c.id', 'a.category_id')
        .leftJoin('categories as p', 'p.id', 'c.parent_id')
        .leftJoin('auction_images as ai', function () {
            this.on('ai.auction_id', '=', 'a.auction_id')
                .andOn('ai.is_thumbnail', '=', db.raw('true'));
        })
        .join('user_account as s', 's.id', 'a.seller_id')
        .leftJoin('user_account as b', 'b.id', 'a.winner_bidder_id')
        .select(
            'a.auction_id',
            'a.name',
            'a.end_time',
            'ai.image_url',
            's.full_name as seller_name',
            'b.full_name as top_bidder_name',
            'c.cat_name as category_name',
            'p.cat_name as parent_name',
            db.raw(`
                CASE 
                    WHEN a.current_price IS NULL OR a.current_price = 0 
                    THEN a.starting_price 
                    ELSE a.current_price 
                END AS "currentPrice"
            `),
            db.raw(`
                (SELECT COUNT(*) 
                 FROM auction_bids ab 
                 WHERE ab.auction_id = a.auction_id
                ) AS bid_count
            `)
        )
        .where('a.status', 'Bidding')
        .andWhere('a.end_time', '>', db.raw('NOW()'))
        .orderBy('a.end_time', 'asc')
        .limit(5);
}


export function getTop5MostBidsAuctions() {
    return db('auction as a')
        .join('categories as c', 'c.id', 'a.category_id')
        .leftJoin('categories as p', 'p.id', 'c.parent_id')
        .leftJoin('auction_images as ai', function () {
            this.on('ai.auction_id', '=', 'a.auction_id')
                .andOn('ai.is_thumbnail', '=', db.raw('true'));
        })
        .join('user_account as s', 's.id', 'a.seller_id')
        .leftJoin('user_account as b', 'b.id', 'a.winner_bidder_id')
        .select(
            'a.auction_id',
            'a.name',
            'a.end_time',
            'ai.image_url',
            's.full_name as seller_name',
            'b.full_name as top_bidder_name',
            'c.cat_name as category_name',
            'p.cat_name as parent_name',
            db.raw(`
                CASE 
                    WHEN a.current_price IS NULL OR a.current_price = 0 
                    THEN a.starting_price 
                    ELSE a.current_price 
                END AS "currentPrice"
            `),
            db.raw(`
                (SELECT COUNT(*) 
                 FROM auction_bids ab 
                 WHERE ab.auction_id = a.auction_id
                ) AS bid_count
            `)
        )
        .where('a.status', 'Bidding')
        .andWhere('a.end_time', '>', db.raw('NOW()'))
        .orderBy('bid_count', 'desc')
        .limit(5);
}



export function getTop5HighestPriceAuctions() {
    return db('auction as a')
        .join('categories as c', 'c.id', 'a.category_id')
        .leftJoin('categories as p', 'p.id', 'c.parent_id')
        .leftJoin('auction_images as ai', function () {
            this.on('ai.auction_id', '=', 'a.auction_id')
                .andOn('ai.is_thumbnail', '=', db.raw('true'));
        })
        .join('user_account as s', 's.id', 'a.seller_id')
        .leftJoin('user_account as b', 'b.id', 'a.winner_bidder_id')
        .select(
            'a.auction_id',
            'a.name',
            'a.end_time',
            'ai.image_url',
            's.full_name as seller_name',
            'b.full_name as top_bidder_name',
            'c.cat_name as category_name',
            'p.cat_name as parent_name',
            db.raw(`
                CASE 
                    WHEN a.current_price IS NULL OR a.current_price = 0 
                    THEN a.starting_price 
                    ELSE a.current_price 
                END AS "currentPrice"
            `),
            db.raw(`
                (SELECT COUNT(*) 
                 FROM auction_bids ab 
                 WHERE ab.auction_id = a.auction_id
                ) AS bid_count
            `)
        )
        .where('a.status', 'Bidding')
        .andWhere('a.end_time', '>', db.raw('NOW()'))
        .orderBy('currentPrice', 'desc')
        .limit(5);
}


export function getAuctionParticipants(auction_id) {
    return db('user_account')
        .distinct('user_account.full_name', 'user_account.email')
        .join('auction_bids', function() {
            this.on('user_account.id', '=', 'auction_bids.bidder_id')
                .andOn('auction_bids.auction_id', '=', auction_id);
        })
        .union(function() {
            this.select('user_account.full_name', 'user_account.email')
                .from('user_account')
                .join('comments', function() {
                    this.on('user_account.id', '=', 'comments.user_id')
                        .andOn('comments.auction_id', '=', auction_id);
                })
                .whereNull('comments.parent_id');
        });
}



export function getBiddersParticipants(auction_id) {
    return db('user_account')
        .distinct('user_account.full_name', 'user_account.email')
        .join('auction_bids', function() {
            this.on('user_account.id', '=', 'auction_bids.bidder_id')
                .andOn('auction_bids.auction_id', '=', auction_id);
        });
}

