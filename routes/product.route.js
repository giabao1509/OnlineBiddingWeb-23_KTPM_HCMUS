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
    const q = req.query.search || '';
    const kw = q.replace(/ /g, ' & ');

    const page = parseInt(req.query.page) || 1;
    const limit = 1;
    const offset = (page - 1) * limit;
    
    let products;
    let totalProducts;

    if (q !== '') {
        products  = await productsService.search(kw, limit, offset);
        totalProducts = await productsService.countSearch(kw);
    } else {
        products  = await productsService.getAllProducts(limit, offset);
        totalProducts = await productsService.countAll();
    }
    

    const ids = products.map(p => p.auction_id);

    const photos = await productsService.getAllProductsPhotos(ids)

    for (const p of products) {
    const imgs = photos.filter(img => img.auction_id === p.auction_id);
    p.photos = imgs;
    p.thumbnail = imgs.find(i => i.is_thumbnail);
    }

    
    const totalPages = Math.ceil(+totalProducts.count / limit);
    
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
    sort: req.query.sort || ''
    };

    console.log(queryParams)
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

