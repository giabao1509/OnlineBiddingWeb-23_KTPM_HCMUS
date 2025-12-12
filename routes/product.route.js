import express from 'express';
import * as productsService from '../services/product.service.js';
import { maskName } from '../utils/mask.js';
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

router.get('/detail/:id', async (req, res) => {
    const auctionID = req.params.id || 0;

    const product = await productsService.getProductsDetailById(auctionID);

    const photos = await productsService.getAllProductsPhotos([auctionID]);

     product.images = photos;

    const biddingHistory = await productsService.getProductBiddingHistory(auctionID);

    product.bidHistory = biddingHistory;

    //Format lại time remaining
    const now = new Date();
    const end = new Date(product.end_time);
    let diffMs = end - now;
    if (diffMs <= 0) {
    product.time_remaining = "Đã kết thúc";
    } else {
        const diffSec = Math.floor(diffMs / 1000);

        const days = Math.floor(diffSec / (24 * 3600));
        const hours = Math.floor((diffSec % (24 * 3600)) / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        const seconds = diffSec % 60;

        product.time_remaining = 
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    //Mask tên
    product.bidHistory = biddingHistory.map(b => ({
    ...b,
    bidder_name: maskName(b.bidder_name)
    }));

    //Lấy giá hiện tại của sản phẩm
    let max = biddingHistory[0];
    for (let i = 1; i < biddingHistory.length; i++) {
        if (Number(biddingHistory[i].amount) > Number(max.amount)) {
            max = biddingHistory[i];
        }
    }
    product.current_bid = max.amount

   
    console.log(product);
    res.render('Products/detail', {product})
});

export default router

