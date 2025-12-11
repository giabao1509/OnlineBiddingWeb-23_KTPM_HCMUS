import db from '../utils/db.js';

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