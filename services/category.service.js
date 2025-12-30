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

export function getCategoriesById(id) {
    return db('categories').where('id', id)
}


// SELECT
//     c.id,
//     c.cat_name AS category_name,
//     c.parent_id,
//     p.cat_name AS parent_name,
//     COUNT(a.auction_id) AS product_count
// FROM categories c
// LEFT JOIN categories p
//     ON c.parent_id = p.id
// LEFT JOIN categories c_child
//     ON c_child.parent_id = c.id
// LEFT JOIN auction a
//     ON a.category_id = CASE
//         WHEN c.parent_id IS NULL THEN c_child.id
//         ELSE c.id
//     END
// GROUP BY c.id, c.cat_name, c.parent_id, p.cat_name
export function getAllCategoriesWithProductCount() {
    return db('categories as c')
        .leftJoin('categories as p', 'c.parent_id', 'p.id')
        .leftJoin('categories as c_child', 'c_child.parent_id', 'c.id')
        .leftJoin('auction as a', function() {
            this.on('a.category_id', '=', 'c_child.id')
                .orOn('a.category_id', '=', 'c.id');
        })
        .groupBy('c.id', 'c.cat_name', 'c.parent_id', 'p.cat_name')
        .orderBy('c.id')
        .select(
            'c.id',
            'c.cat_name AS category_name',
            'c.parent_id',
            'p.cat_name AS parent_name',
            db.raw('COUNT(a.auction_id) AS product_count')
        );

}

export function addCategory(category) {
    return db('categories').insert(category);
}

export function updateCategory(categoryId, updatedData) {
    return db('categories')
        .where('id', categoryId)
        .update(updatedData);
}

export function deleteCategory(categoryId) {
    return db('categories')
        .where('id', categoryId)
        .del();
}