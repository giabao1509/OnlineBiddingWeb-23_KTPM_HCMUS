import express from 'express';
const router = express.Router();
import { isAuth, isAdmin } from '../middlewares/auth.mdw.js';
import * as categoryService from '../services/category.service.js';



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

export default router;