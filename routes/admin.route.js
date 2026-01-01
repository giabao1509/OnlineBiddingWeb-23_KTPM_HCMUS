import express from 'express';
const router = express.Router();
import { isAuth, isAdmin } from '../middlewares/auth.mdw.js';
import * as categoryService from '../services/category.service.js';
import * as productsService from '../services/product.service.js';
import { deleteImageByPublicId } from '../utils/cloudinary.js';

router.get('/category', isAuth, isAdmin, async (req, res) => {
    const admincategories = await categoryService.getAllCategoriesWithProductCount();
    console.log(admincategories);
    res.render('Admin/categorymanagement', { admincategories: admincategories });
});

router.post('/category/add', isAuth, isAdmin, async (req, res) => {
    const { category_name, level, parent_id } = req.body;
    let categoryData = {
        cat_name: category_name,
    };
    if (level === 'child' && parent_id) {
        categoryData.parent_id = parent_id;
    }
    console.log(categoryData);
    await categoryService.addCategory(categoryData);
    res.redirect('/admin/category');
});

router.post('/category/edit', isAuth, isAdmin, async (req, res) => {
    const { id, category_name, parent_id } = req.body;
    let updatedData = {
        cat_name: category_name,
    };
    if (parent_id) {
        updatedData.parent_id = parent_id;
    }
    await categoryService.updateCategory(id, updatedData);
    res.redirect('/admin/category');
});


router.post('/category/delete', isAuth, isAdmin, async (req, res) => {
    const { id } = req.body;
    await categoryService.deleteCategory(id);
    res.redirect('/admin/category');
});


router.get('/auction', isAuth, isAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const offset = (page - 1) * limit;
    const totalAuction = await productsService.countAll();
    //console.log(totalAuction);
    const totalPages = Math.ceil(Number(totalAuction.count) / limit);
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPages ? page + 1 : totalPages;
    const isFirstPage = page === 1;
    const isLastPage = page === totalPages;
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({ number: i, active: i === page });
    }
    //console.log(totalPages)
    //console.log(pages);

    const auctions = await productsService.getAllAuctionsForAdmin(limit, offset);
    res.render('Admin/auctionmanagement', { 
        auctions: auctions, 
        prevPage,
        nextPage,
        isFirstPage,
        isLastPage,
        pages
    });
});


router.post('/auction/delete', isAuth, isAdmin, async (req, res) => {
    const { id } = req.body;
    const auctionImages = await productsService.getAllProductsPhotos([id]);
    for (const image of auctionImages) {
        await deleteImageByPublicId(image.public_id);
    }

    await productsService.deleteAuctionById(id);
    res.redirect('/admin/auction');
});

export default router;