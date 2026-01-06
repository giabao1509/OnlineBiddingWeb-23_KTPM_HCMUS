import express from 'express';
import bcrypt from 'bcryptjs';
import * as orderService from '../services/order.service.js';
import * as accountService from '../services/account.service.js'
import { isAuth, isSeller, isBuyer} from '../middlewares/auth.mdw.js';
import uploadOrder from '../utils/uploadOrder.js';

const router = express.Router();

router.get('/:id', isAuth, async (req, res) => {
    const orderId = Number(req.params.id);
    const order = await orderService.getOrderDetailsById(orderId);
    if (order?.status === 'Cancelled') {
        const orderRating = await orderService.getOrderRating(orderId, order.seller_id);
        order.orderRating = orderRating;
        return res.render('Order/completeorder', {
            order,

        });
    }
    //console.log('order:', order);
    
    if (Number(req.user.id) !== order.seller_id && Number(req.user.id) !== order.winner_bidder_id) {
        req.flash('error', 'You are not allowed to view this order.');
        return res.redirect('/');
    }
    
    const bidder = await accountService.getUserExternalInfo(Number(order.winner_bidder_id));
    const bidderInfo = bidder[0]
    bidderInfo.rating_percent = Number(bidderInfo.rating_score) * 100;
    console.log('bidderInfo:', bidderInfo);


    const seller = await accountService.getUserExternalInfo(Number(order.seller_id));
    const sellerInfo = seller[0]
    sellerInfo.rating_percent = Number(sellerInfo.rating_score) * 100;
    console.log('sellerInfo:', sellerInfo);


    const orderstepMap = {
        'Pending': 1,
        'Paid': 2,
        'Delivered': 3,
        'Completed': 4
    };
    order.step = orderstepMap[order.status] || 1;

    if (order.step >= 2) {
        const orderPayment = await orderService.getOrderPaymentByOrderId(orderId);
        if (orderPayment) {
            order.payment_proof = orderPayment.image_url;
            order.payment_address = orderPayment.address;
            order.payment_phone = orderPayment.phone;
            order.payment_notes = orderPayment.notes;
        }
    }


    if (order.step >= 3) {
        const orderShipping = await orderService.getOrderShippingByOrderId(orderId);
        if (orderShipping) {
            order.shipping_proof = orderShipping.image_url;
            order.shipping_updated_at = orderShipping.created_at;
        }
    }

    if (order.step >= 4) {
        const orderRating = await orderService.getOrderRating(orderId, req.user.id);
        order.orderRating = orderRating;
    }

    const messages = await orderService.getMessagesByOrderId(orderId);
    console.log('messages:', messages);
    const formattedMessages = messages.map(m => {
        let sender;

        if (m.sender_id === req.user.id) {
            sender = 'sender';
        } else if (m.sender_id !== req.user.id) {
            sender = 'receiver';
        }

        return {
        ...m,
        sender
        };
    });
    //console.log('formattedMessages:', formattedMessages);
    res.render('Order/completeorder', {
        order,
        formattedMessages,
        isOrderBuyer: Number(req.user.id) === order.winner_bidder_id,
        isOrderSeller: Number(req.user.id) === order.seller_id,
        bidderInfo: bidderInfo,
        sellerInfo: sellerInfo
    });
});


router.post('/:id/payment', isAuth, uploadOrder.single('paymentProof'), async (req, res) => {
    const orderId = req.params.id;
    const { address, phone, notes } = req.body;
    console.log('orderId:', orderId);
    if (!req.file) {
        req.flash('error', 'Please upload a payment proof image.');
        return res.redirect(`/orders/${orderId}`);
    }   

    const paymentProofUrl = req.file.url;
    const orderPayment = {
        id: Number(orderId),
        image_url: paymentProofUrl,
        address: address,
        phone: phone,
        notes: notes
    };
    console.log('orderPayment:', orderPayment);
    await orderService.completeOrderPayment(orderPayment);
    await orderService.updateOrderStatus(orderId, 'Paid');
    req.flash('success', 'Payment proof uploaded successfully.');
    res.redirect(`/orders/${orderId}`);
});


router.post('/:id/confirm_delivery', isAuth, uploadOrder.single('shippingProof'), async (req, res) => {
    const orderId = req.params.id;

    const shippingProofUrl = req.file ? req.file.url : null;
    console.log('shippingProofUrl:', shippingProofUrl);
    const orderShipping = {
        id: Number(orderId),
        image_url: req.file ? req.file.url : null
    };
    await orderService.completeOrderShipping(orderShipping);
    await orderService.updateOrderStatus(orderId, 'Delivered');
    req.flash('success', 'Order marked as delivered. Thank you for shopping with us!');
    res.redirect(`/orders/${orderId}`);
});


router.post('/:id/confirm_received', isAuth, async (req, res) => {
    const orderId = req.params.id;
    console.log('orderId:', orderId);
    await orderService.updateOrderStatus(orderId, 'Completed');
    req.flash('success', 'Order marked as completed. Thank you for shopping with us!');
    res.redirect(`/orders/${orderId}`);
});

router.post('/:id/rate', isAuth, async (req, res) => {
    
    const orderId = req.params.id;
    const { reviewer, reviewee, rating, comment } = req.body;
    const ratingData = {
        order_id: Number(orderId),
        reviewer_id: Number(reviewer),
        reviewee_id: Number(reviewee),
        rating: Number(rating),
        comment: comment
    };

    //console.log('ratingData:', ratingData);
    await orderService.submitOrderRating(ratingData);
    res.redirect(`/orders/${orderId}`);
});


router.post('/:id/update_rate', isAuth, async (req, res) => {
    
    const orderId = req.params.id;
    const { reviewer, reviewee, rating, comment } = req.body;
    const ratingData = {
        rating: Number(rating),
        comment: comment
    };
    //console.log('ratingData:', ratingData);
    await orderService.updateOrderRating(orderId, Number(reviewer), ratingData);
    res.redirect(`/orders/${orderId}`);
});

router.post('/:id/send_message', isAuth, async (req, res) => {
    const orderId = req.params.id;
    const { content } = req.body;

    const message = {
        order_id: Number(orderId),
        sender_id: Number(req.user.id),
        content: content
    };
    await orderService.sendMessage(message);
    res.redirect(`/orders/${orderId}`);
});

router.post('/:id/cancel', async (req, res) => {

    const orderId = req.params.id;
    const { cancel_reason, reviewer, reviewee } = req.body;
    console.log('orderId:', orderId);
    const comment = cancel_reason || 'Người thắng không thanh toán';
    const ratingData = {
        order_id: Number(orderId),
        reviewer_id: Number(reviewer),
        reviewee_id: Number(reviewee),
        rating: -1,
        comment: comment
    };
    console.log('ratingData:', ratingData);
    await orderService.submitOrderRating(ratingData);
    await orderService.updateOrderStatus(orderId, 'Cancelled');
    //await orderService.updateOrderStatus(orderId, 'Cancelled');
    req.flash('success', 'Order cancelled successfully.');
    res.redirect(`/orders/${orderId}`);
});

export default router;