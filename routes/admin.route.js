import express from 'express';
const router = express.Router();
import { isAuth, isAdmin } from '../middlewares/auth.mdw.js';
import * as categoryService from '../services/category.service.js';
import * as productsService from '../services/product.service.js';
import * as accountService from '../services/account.service.js';
import * as upgradeRequestService from '../services/upgrade_request.service.js';
import * as auctionConfigService from '../services/auction_config.service.js';
import { deleteImageByPublicId } from '../utils/cloudinary.js';
import bcrypt from 'bcryptjs';

router.get('/category', isAuth, isAdmin, async (req, res) => {
     const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    const totalCategories = await categoryService.countAllCategories();
    //console.log(totalAuction);
    const totalPages = Math.ceil(Number(totalCategories.count) / limit);
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPages ? page + 1 : totalPages;
    const isFirstPage = page === 1;
    const isLastPage = page === totalPages;
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({ number: i, active: i === page });
    }
    const admincategories = await categoryService.getAllCategoriesWithProductCount(limit, offset);
    const parentCategories = await categoryService.getCategories();
    //console.log(admincategories);
    res.render('Admin/categorymanagement', { 
        admincategories: admincategories,
        parentCategories: parentCategories,
        prevPage,
        nextPage,
        isFirstPage,
        isLastPage,
        pages,
        totalPages
    });
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
    const limit = 5;
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
    const autoExtend = await auctionConfigService.getAuctionConfig();
    //console.log(autoExtend);
    const auctions = await productsService.getAllAuctionsForAdmin(limit, offset);
    res.render('Admin/auctionmanagement', { 
        auctions: auctions, 
        autoExtend: autoExtend,
        prevPage,
        nextPage,
        isFirstPage,
        isLastPage,
        pages,
        totalPages
    });
});

router.post('/auction/set_auto_extend', isAuth, isAdmin, async (req, res) => {
    const is_auto_extend = req.body.is_auto_extend === 'on' ? true : false;
    const extend_threshold_minutes = parseInt(req.body.extend_threshold_minutes) || 0;
    const extend_duration_minutes = parseInt(req.body.extend_duration_minutes) || 0;
    //console.log({is_auto_extend, extend_threshold_minutes, extend_duration_minutes});
    const existingConfig = await auctionConfigService.getAuctionConfig();
    
    if (!existingConfig) {
        // Nếu chưa có cấu hình, chèn mới
        await auctionConfigService.initializeAuctionConfig({
            is_auto_extend,
            extend_threshold_minutes,  
            extend_duration_minutes
        });
        return res.redirect('/admin/auction');
    }

    // Cập nhật cấu hình nếu đã tồn tại
    await auctionConfigService.updateAuctionConfig({
        is_auto_extend,
        extend_threshold_minutes,  
        extend_duration_minutes
    });
    res.redirect('/admin/auction');
    // const { id } = req.body;
    // await productsService.updateAuctionStatus(id, 'Active');
    // res.redirect('/admin/auction');
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


router.get('/users', isAuth, isAdmin, async (req, res) => {
    const tab = req.query.tab || 'user'; // mặc định tab user

    let users = [];
    let upgradeRequests = [];
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    let totalPages = 1;
     if (tab === 'user') {
        const totalUser = await accountService.countAllUsers();
        users = await accountService.getAllUsers(limit, offset);
        totalPages = Math.ceil(Number(totalUser.count) / limit);
    }

    if (tab === 'upgrade') {
        const totalRequest = await upgradeRequestService.countAllUpgradeRequests();
        upgradeRequests = await upgradeRequestService.getAllUpgradeRequests(limit, offset);
        totalPages = Math.ceil(Number(totalRequest.count) / limit);
    }
    
    //console.log(totalAuction);
    
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPages ? page + 1 : totalPages;
    const isFirstPage = page === 1;
    const isLastPage = page === totalPages;
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({ number: i, active: i === page });
    }
   

    res.render('Admin/usermanagement', {
        tab,                
        users,
        upgradeRequests,
        prevPage,
        nextPage,
        isFirstPage,
        isLastPage,
        pages,
        totalPages
    });
    
});



router.post('/users/add', isAuth, isAdmin, async (req, res) => {
    const { full_name, email, role, password, confirm_password } = req.body;
    const checkExisting = await accountService.getAccountByEmail(email);
    if (checkExisting) {
        //return res.render('Admin/usermanagement', { error: "Email is already registered." });
        req.flash('error', 'Email is already registered.');
        return res.redirect('/admin/users');
    }

    if (password.length < 8) {
        req.flash('error', 'Password must be at least 8 characters long.');
        return res.redirect('/admin/users');
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
        req.flash('error', 'Password must contain at least one special character.');
        return res.redirect('/admin/users');
    }

    if (password !== confirm_password) {
        //return res.render('Admin/usermanagement', { error: "Passwords do not match." });
        req.flash('error', 'Passwords do not match.');
        return res.redirect('/admin/users');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        full_name,
        email,
        role,
        password: hashedPassword
    };
    console.log(newUser);
    await accountService.addAccount(newUser);
    req.flash('success', 'New user added successfully.');
    res.redirect('/admin/users');
});


router.post('/users/edit', isAuth, isAdmin, async (req, res) => {
    const { id, full_name, email, role } = req.body;
    const updatedData = {
        full_name,
        email,
        role
    };
    const checkExisting = await accountService.getAccountByEmail(email);
    if (checkExisting && Number(checkExisting.id) !== Number(id)) {
        req.flash('error', 'Email is already registered to another user.');
        return res.redirect('/admin/users');
    }
    try {
    await accountService.updateAccount(id, updatedData);
    } catch (error) {
        req.flash('error', 'Error updating user. Please try again.');
        return res.redirect('/admin/users');
    }
    req.flash('success', 'User updated successfully.');
    res.redirect('/admin/users');
});

router.post('/users/delete', isAuth, isAdmin, async (req, res) => {
    const { id } = req.body;
    try {
        await accountService.updateAccount(id, { status: 'Blocked' });
    } catch (error) {
        req.flash('error', 'Error blocking user. Please try again.');
        return res.redirect('/admin/users');
    }
    req.flash('success', 'User blocked successfully.');
    res.redirect('/admin/users');
});

router.post('/users/unblock', isAuth, isAdmin, async (req, res) => {
    const { id } = req.body;
    try {
        await accountService.updateAccount(id, { status: 'Active' });
    } catch (error) {
        req.flash('error', 'Error unblocking user. Please try again.');
        return res.redirect('/admin/users');
    }
    req.flash('success', 'User unblocked successfully.');
    res.redirect('/admin/users');
});

router.post('/users/upgrade/approve', isAuth, isAdmin, async (req, res) => {
    const { id, customer_id } = req.body;
    try {
        await accountService.updateAccount(customer_id, { role: 1 });
        await upgradeRequestService.updateUpgradeRequestStatus(id, 'Approved');
    }
    catch (error) {
        req.flash('error', 'Error approving upgrade request. Please try again.');
        return res.redirect('/admin/users');
    }
    req.flash('success', 'Upgrade request approved successfully.');
    res.redirect('/admin/users');
});
export default router;