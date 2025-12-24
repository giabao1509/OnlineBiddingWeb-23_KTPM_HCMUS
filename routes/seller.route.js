import express from 'express';
import * as productsService from '../services/product.service.js';
import { maskName } from '../utils/mask.js';
import { isAuth, isSeller } from '../middlewares/auth.mdw.js';
import upload from '../utils/upload.js';
const router = express.Router();

router.get('/dashboard', isAuth, isSeller, async (req, res) => {
    res.render('Seller/dashboard');
});

router.get('/create_product', async (req, res) => {
    try {
        res.render('Seller/createproduct', {
            categoriesJson: JSON.stringify(res.locals.categories),
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.post('/create_product', isAuth, upload.array('images', 10), async (req, res) => {
    try {
        const {
            title,
            parentCategory,
            subCategory,
            startPrice,
            bidStep,
            buyNowPrice,
            duration,
            autoExtend,
            description
        } = req.body;

        // ===== 1. TẠO AUCTION =====
        const newAuction = {
            seller_id: req.user.id,
            category_id: subCategory || parentCategory,
            name: title,
            description,
            starting_price: Number(startPrice),
            buy_now_price: buyNowPrice ? Number(buyNowPrice) : null,
            bid_step: Number(bidStep),
            auto_extend: autoExtend === 'on',   
            end_time: new Date(
                Date.now() + Number(duration) * 24 * 60 * 60 * 1000
            )
        };
        //console.log(newProducts);
        const auctionId = await productsService.addProduct(newAuction);

        console.log('New auction ID:', auctionId[0].auction_id);
        //console.log(req.files);
        // ===== 2. XỬ LÝ ẢNH =====
        const images = req.files.map((file, index) => ({
            auction_id: auctionId[0].auction_id,
            image_url: file.url,
            is_thumbnail: index === 0
        }));
        console.log(images);

        await productsService.addProductImages(images);

        //console.log(images);

        //await auctionService.insertAuctionImages(images);

        // ===== 3. REDIRECT =====
        //res.redirect(`/auctions/${auctionId}`);
        res.render('Seller/createproduct', {
            categoriesJson: JSON.stringify(res.locals.categories),
            success: 'Product created successfully!'
        });
    } catch (err) {
        console.error(err);
    }
});


export default router;

