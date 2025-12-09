import db from '../utils/db.js';


export function getCategories() {
    return db('categories')
        .select('id', 'cat_name')
        .whereNull('parent_id');
}

export function getSubCategories(parentId) {
    return db('categories')
        .select('id', 'cat_name')
        .where('parent_id', parentId);
}
