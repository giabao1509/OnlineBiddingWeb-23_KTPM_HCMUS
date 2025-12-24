import express from 'express';
const router = express.Router();
import { isAuth } from '../middlewares/auth.mdw.js';


router.get('/dashboard', isAuth, async (req, res) => {

    const activeBids = [
        {
            id: 101,
            title: "iPhone 14 Pro Max 256GB",
            category: "Điện thoại",
            image: "/img/products/iphone14.jpg",
            yourBid: 21000000,
            currentBid: 21500000,
            isWinning: false,
            timeRemaining: "2 giờ 15 phút"
        },
        {
            id: 102,
            title: "Laptop ASUS ROG Strix G15",
            category: "Laptop Gaming",
            image: "/img/products/rog-g15.jpg",
            yourBid: 15000000,
            currentBid: 14800000,
            isWinning: true,
            timeRemaining: "45 phút"
        }
    ];

    const endingSoon = [
        {
            id: 201,
            title: "Tai nghe AirPods Pro 2",
            image: "/img/products/airpods2.jpg",
            currentBid: 4200000,
            timeLeft: "12 phút"
        },
        {
            id: 202,
            title: "Đồng hồ Casio G-SHOCK",
            image: "/img/products/gshock.jpg",
            currentBid: 2800000,
            timeLeft: "25 phút"
        }
    ];

    const wonAuctions = [
        {
            orderId: 3001,
            title: "Chuột Logitech G Pro Wireless",
            image: "/img/products/logitech-gpro.jpg",
            winningBid: 1800000,
            isPaid: true
        },
        {
            orderId: 3002,
            title: "Monitor LG Ultrawide 29''",
            image: "/img/products/lg-ultrawide.jpg",
            winningBid: 4500000,
            isPaid: false
        }
    ];

    const watchlist = [
        {
            id: 401,
            title: "PS5 Slim Digital Edition",
            image: "/img/products/ps5.jpg",
            currentBid: 9500000,
            timeLeft: "3 giờ"
        },
        {
            id: 402,
            title: "Bàn phím cơ Keychron K4",
            image: "/img/products/keychron-k4.jpg",
            currentBid: 1600000,
            timeLeft: "1 giờ 20 phút"
        }
    ];

    res.render('Buyer/dashboard', {
        activeBids,
        endingSoon,
        wonAuctions,
        watchlist
    });
});

export default router;