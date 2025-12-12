import express from 'express';
import * as productsService from '../services/product.service.js';

const router = express.Router();


router.get('/', async (req, res) => {

    

    const page = parseInt(req.query.page) || 1;
    const limit = 1;
    const offset = (page - 1) * limit;
    

    const products = await productsService.getAllProducts(limit, offset);

    const ids = products.map(p => p.auction_id);

    const photos = await productsService.getAllProductsPhotos(ids)

    for (const p of products) {
    const imgs = photos.filter(img => img.auction_id === p.auction_id);
    p.photos = imgs;
    p.thumbnail = imgs.find(i => i.is_thumbnail);
    }

    const totalProducts = await productsService.countAll();
    const totalPages = Math.ceil(+totalProducts.count / limit);
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({ number: i, active: i === page });
    }


    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPages ? page + 1 : totalPages;
    const isFirstPage = page === 1;
    const isLastPage = page === totalPages;


    res.render('Products/all',{
        products,
        pages,
        prevPage,
        nextPage,
        isFirstPage,
        isLastPage,
    }
       
    );


});


router.get('/search', async (req, res) => {
    const s = req.query.search || '';
    const kw = s.replace(/ /g, ' & ');
    const c = req.query.category || '';


    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const offset = (page - 1) * limit;
    
    let products;
    let totalProducts;

    const sortMap = {
        newest: { field: 'a.created_at', order: 'desc' },
        ending_soon: { field: 'a.end_time', order: 'asc' },
        price_low: { field: 'a.starting_price', order: 'asc' },
        price_high: { field: 'a.starting_price', order: 'desc' },
        //most_bids: { field: 'a.bid_count', order: 'desc' }
    };

    const sortKey = req.query.sort || 'newest';
    const sortConfig = sortMap[sortKey] || sortMap['newest'];
    const sortField = sortConfig.field;
    const sortOrder = sortConfig.order;

    products  = await productsService.searchByCategoryKeywordAndSort(c, kw, limit, offset, sortField, sortOrder)
    //console.log('products:', products);
    totalProducts = await productsService.countByCategoryKeyword(c, kw);
    //console.log('total products:', totalProducts)

    const ids = products.map(p => p.auction_id);

    const photos = await productsService.getAllProductsPhotos(ids)

    for (const p of products) {
    const imgs = photos.filter(img => img.auction_id === p.auction_id);
    p.photos = imgs;
    p.thumbnail = imgs.find(i => i.is_thumbnail);
    }    
    
    const totalPages = Math.ceil(totalProducts / limit);
    //console.log('total page:', totalPages)
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({ number: i, active: i === page });
    }


    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPages ? page + 1 : totalPages;
    const isFirstPage = page === 1;
    const isLastPage = page === totalPages;
    
    const queryParams = {
    search: req.query.search || '',
    category: req.query.category || '',
    sort: req.query.sort || 'newest'
    };

    //console.log(queryParams)
    res.render('Products/all', {
    products,
    query: queryParams,
    empty: products.length === 0,
    pages,
    prevPage,
    nextPage,
    isFirstPage,
    isLastPage,
    });
});

export default router

