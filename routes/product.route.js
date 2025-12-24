import express from 'express';
import * as productsService from '../services/product.service.js';
import { maskName } from '../utils/mask.js';
import { isAuth } from '../middlewares/auth.mdw.js';
const router = express.Router();




router.get('/', async (req, res) => {
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
  const auctionID = Number(req.params.id) || 0;

  const product = await productsService.getProductsDetailById(auctionID);
  if (!product) {
    return res.status(404).render('404');
  }

  /* ========= IMAGES ========= */
  const photos = await productsService.getAllProductsPhotos([auctionID]);
  product.images = photos || [];

  /* ========= BIDDING HISTORY ========= */
  const biddingHistory = await productsService.getProductBiddingHistory(auctionID);
  product.bidHistory = biddingHistory || [];

  // Mask tên nếu có history
  if (product.bidHistory.length > 0) {
    product.bidHistory = product.bidHistory.map(b => ({
      ...b,
      bidder_name: maskName(b.bidder_name)
    }));

    // Lấy giá hiện tại
    let max = product.bidHistory[0];
    for (let i = 1; i < product.bidHistory.length; i++) {
      if (Number(product.bidHistory[i].amount) > Number(max.amount)) {
        max = product.bidHistory[i];
      }
    }
    product.current_bid = max.amount;
  } else {
    // Chưa có ai bid
    product.current_bid = product.starting_price;
  }

  /* ========= TIME REMAINING ========= */
  const now = new Date();
  const end = new Date(product.end_time);
  const diffMs = end - now;

  if (diffMs <= 0) {
    product.time_remaining = "Đã kết thúc";
  } else {
    const diffSec = Math.floor(diffMs / 1000);
    const days = Math.floor(diffSec / (24 * 3600));
    const hours = Math.floor((diffSec % (24 * 3600)) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    product.time_remaining = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  /* ========= COMMENTS ========= */
  const comments = await productsService.getAllProductComments(auctionID) || [];

  const roots = comments.filter(c => c.parent_id === null);
  roots.forEach(c => {
    c.reply = comments.filter(r => r.parent_id === c.comment_id);
  });

  product.comments = roots;

  const total_comments = await productsService.countProductComments(auctionID);
  product.total_comments = total_comments?.count || 0;

  res.render('Products/detail', { product });
});




router.post('/comments/create', isAuth, async (req, res) => {
    const { auction_id, content, parent_id } = req.body;


    if (!content || !content.trim()) {
        return res.status(400).send('Content is required');
    }

    const comment = {
        auction_id: Number(auction_id),
        content,
        parent_id: parent_id ? Number(parent_id) : null,
        user_id: req.user.id
    }


    //console.log(comment)
    await productsService.addProductComments(comment)

    const retUrl = req.headers.referer || '/';
    res.redirect(retUrl);
});


export default router

