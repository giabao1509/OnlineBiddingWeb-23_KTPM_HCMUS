import db from '../utils/db.js';


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
    .where('auction_id', auction_id);
}