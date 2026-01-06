import express from 'express';
import * as productsService from '../services/product.service.js';
import * as accountService from '../services/account.service.js'
import { maskName } from '../utils/mask.js';
import { isAuth } from '../middlewares/auth.mdw.js';
import * as bidsService from '../services/bids.service.js';
import { appendDescriptionWithDate } from '../utils/appenDescription.js';
import { displayTimeRemaining } from '../utils/displayTimeRemaining.js';
import { buildCommentTree } from '../utils/buildCommentTree.js';
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
        price_low: { field: 'sort_price', order: 'asc' },
        price_high: { field: 'sort_price', order: 'desc' },
        most_bids: { field: 'bid_count', order: 'desc' }
    };

    const sortKey = req.query.sort || 'newest';
    const sortConfig = sortMap[sortKey] || sortMap['newest'];
    const sortField = sortConfig.field;
    const sortOrder = sortConfig.order;

    products  = await productsService.searchByCategoryKeywordAndSort(c, kw, limit, offset, sortField, sortOrder)
    

    products.forEach(p => {
        p.time_remaining = displayTimeRemaining(p.end_time);
        if (p.top_bidder_name) {
            p.top_bidder_name = maskName(p.top_bidder_name);
        }
    });

    console.log('products:', products);

    totalProducts = await productsService.countByCategoryKeyword(c, kw);
    
    const totalPages = Math.ceil(totalProducts / limit);
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

    let sortOptions = [
            { value: 'newest', name: 'Newest' },
            { value: 'price_low', name: 'Price: Low → High' },
            { value: 'price_high', name: 'Price: High → Low' },
            { value: 'most_bids', name: 'Most Bids' }
        ];
    const selectedSort = sortKey || 'newest';
    sortOptions.forEach(opt => {
    opt.selected = opt.value === selectedSort;
    });
    console.log('sortOptions:', sortOptions);
    console.log('selectedSort:', selectedSort);
    //console.log(queryParams)
    res.render('Products/all', {
    products,
    query: queryParams,
    empty: products.length === 0,
    sortOptions,
    selectedSort,
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
      mask_name: maskName(b.bidder_name)
    }));
  }
  product.totalBid = product.bidHistory.length



  const seller = await accountService.getUserExternalInfo(product.seller_id);
  const sellerInfo = seller[0]
  sellerInfo.rating_percent = Number(sellerInfo.rating_score) * 100;
  //console.log('sellerInfo:', sellerInfo);

  
  const topBidder = await accountService.getUserExternalInfo(product.winner_bidder_id);
  let topBidderInfo = null;

  if (topBidder && topBidder.length > 0 && topBidder[0]) {
      topBidderInfo = topBidder[0];
      
      topBidderInfo.rating_percent = Number(topBidderInfo.rating_score || 0) * 100;
      
      topBidderInfo.mask_name = maskName(topBidderInfo.full_name);

      console.log('topBidderInfo:', topBidderInfo);
  }

  /* ========= TIME REMAINING ========= */
  product.time_remaining = displayTimeRemaining(product.end_time);

  /* ========= COMMENTS ========= */
  const comments = await productsService.getAllProductComments(auctionID) || [];

  // const roots = comments.filter(c => c.parent_id === null);
  // roots.forEach(c => {
  //   c.reply = comments.filter(r => r.parent_id === c.comment_id);
  // });



  // product.comments = roots;

  // if (product.comments.length > 0) {
  //   product.comments = product.comments.map(c => ({
  //     ...c,
  //     reply: c.reply.map(r => ({
  //       ...r 
  //     }))
  //   }));
  // }

  product.comments = buildCommentTree(comments);
  console.log(product.comments);
  const total_comments = await productsService.countProductComments(auctionID);
  product.total_comments = total_comments?.count || 0;




  const relatedProducts = await productsService.getAllRelatedProducts(auctionID, Number(product.category_id));

  res.render('Products/detail', { 
    product, 
    relatedProducts, 
    sellerInfo,
    topBidderInfo
  });
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

