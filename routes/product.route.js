import express from 'express';
import * as productsService from '../services/product.service.js';
import { maskName } from '../utils/mask.js';
import { isAuth } from '../middlewares/auth.mdw.js';
import * as bidsService from '../services/bids.service.js';
import { appendDescriptionWithDate } from '../utils/appenDescription.js';
const router = express.Router();




router.get('/', async (req, res) => {
    const s = req.query.search || '';
    const kw = s.replace(/ /g, ' & ');
    const c = req.query.category || '';


    const page = parseInt(req.query.page) || 1;
    const limit = 8;
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
    currentPage: page,
    totalPages
    });
});

router.get('/detail/:id', async (req, res) => {
  const auctionID = Number(req.params.id) || 0;

  const product = await productsService.getProductsDetailById(auctionID);
  if (res.locals.user) {
    product.isOwner = Number(res.locals.user.id) === product.seller_id;
  }

  const relatedProducts = await productsService.getAllRelatedProducts(auctionID, Number(product.category_id));

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
  }

  

  console.log('Bidding history:', product.bidHistory);
  product.totalBid = product.bidHistory.length
  console.log('Total bids:', product.totalBid);
  const top_bidder = await productsService.getTop1Bidders(auctionID);
  //console.log('Top bidder:', top_bidder);

  product.top_bidder = top_bidder ? {
    ...top_bidder,
    bidder_name: maskName(top_bidder.bidder_name)
  } : null; 
  

  /* ========= TIME REMAINING ========= */
  const now = new Date();
  const end = new Date(product.end_time);

  const diffMs = end - now;

  if (diffMs <= 0) {
      product.time_remaining = "Ended";
  } else {
      const diffSec = Math.floor(diffMs / 1000);
      const days = Math.floor(diffSec / (24 * 3600));
      const hours = Math.floor((diffSec % (24 * 3600)) / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      // If less than 3 days → show relative time
      if (days < 3) {
          if (days > 0) {
              product.time_remaining = `${days} day${days > 1 ? 's' : ''} left`;
          } else if (hours > 0) {
              product.time_remaining = `${hours} hour${hours > 1 ? 's' : ''} left`;
          } else if (minutes > 0) {
              product.time_remaining = `${minutes} minute${minutes > 1 ? 's' : ''} left`;
          } else {
              product.time_remaining = `${seconds} second${seconds > 1 ? 's' : ''} left`;
          }
      } else {
          // Show full countdown if >= 3 days
          product.time_remaining = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }
  }


  /* ========= COMMENTS ========= */
  const comments = await productsService.getAllProductComments(auctionID) || [];

  const roots = comments.filter(c => c.parent_id === null);
  roots.forEach(c => {
    c.reply = comments.filter(r => r.parent_id === c.comment_id);
  });

  

  product.comments = roots;

  if (product.comments.length > 0) {
    product.comments = product.comments.map(c => ({
      ...c,
      user_name: maskName(c.user_name),
      reply: c.reply.map(r => ({
        ...r,
        user_name: maskName(r.user_name)
      }))
    }));
  }
  //console.log(product.comments);
  const total_comments = await productsService.countProductComments(auctionID);
  product.total_comments = total_comments?.count || 0;

  res.render('Products/detail', { product, relatedProducts });
});

router.post('/detail/:id/description/edit', isAuth, async (req, res) => {
  const productId = Number(req.params.id);
  const newContent = req.body.description || '';

  // Lấy mô tả cũ từ DB
  const product = await productsService.getProductsDetailById(productId);
  if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('back');
  }

  const updatedDescription = appendDescriptionWithDate(product.description, newContent);

  await productsService.updateProductDescription(productId, updatedDescription);

  req.flash('success', 'Product description updated.');
  const retUrl = req.headers.referer || '/';
  res.redirect(retUrl);
});

router.post('/detail/:id/bid', isAuth, async (req, res) => {
    const { max_bid, max_bid_display } = req.body
    console.log('Max bid (raw):', max_bid);
    const auction_id = req.params.id;
    const bidder_id = req.user.id;
    const bid = {
        auction_id: Number(auction_id),
        bidder_id: Number(bidder_id),
        max_bid: Number(max_bid),
    };
    console.log(bid);
    await bidsService.placeBid(bid);

    req.flash('success', 'Your bid has been placed successfully.');
    const retUrl = req.headers.referer || '/';
    res.redirect(retUrl);
});

router.post('/detail/:id/bid/reject', isAuth, async (req, res) => {
    const { bidId } = req.body;
    const auction_id = req.params.id;
    await bidsService.rejectBid(Number(bidId), Number(auction_id));
    console.log('Rejected bid ID:', bidId);
    console.log('For auction ID:', auction_id);
    req.flash('success', 'The bid has been rejected successfully.');
    const retUrl = req.headers.referer || '/';
    res.redirect(retUrl);
});

router.post('/add_to_watchlist/:id', isAuth, async (req, res) => {
    const auction_id = req.params.id;
    const user_id = req.user.id;
    await productsService.addToWatchList({user_id: Number(user_id), auction_id: Number(auction_id)});
    req.flash('success', 'Product added to your watchlist.');
    const retUrl = req.headers.referer || '/';
    res.redirect(retUrl);
});


router.post('/detail/:id/comments/create', isAuth, async (req, res) => {
    const { content, parent_id } = req.body;
    const auction_id = req.params.id;

    if (!content || !content.trim()) {
        return res.status(400).send('Content is required');
    }

    const comment = {
        auction_id: Number(auction_id),
        content,
        parent_id: parent_id ? Number(parent_id) : null,
        user_id: req.user.id
    }

    if (!parent_id) {
      //send email notification to seller about new comment
    }
    //console.log(comment)
    await productsService.addProductComments(comment)

    const retUrl = req.headers.referer || '/';
    res.redirect(retUrl);
});





export default router

