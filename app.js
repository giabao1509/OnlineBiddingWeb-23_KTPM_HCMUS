import './bootstrap.js'


import express from 'express';
import { engine } from 'express-handlebars';
import expressHandlebarsSections from 'express-handlebars-sections';
import accountRouter from './routes/account.route.js';
import productRouter from './routes/product.route.js';
import {attachLayoutData} from './middlewares/auth.mdw.js';
import cookieParser from 'cookie-parser';
import sellerRouter from './routes/seller.route.js';
import buyerRouter from './routes/buyer.route.js';
import adminRouter from './routes/admin.route.js';
import orderRouter from './routes/order.route.js';
import session from 'express-session';
import { startAuctionUpdater } from './utils/cron.js';
import flash from 'connect-flash';


const PORT = process.env.PORT || 3000;
const app = express();

startAuctionUpdater();

app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: false
}));

app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.engine('handlebars', engine({
  helpers: {
    format_currency(value) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    },
    gt: (a, b) => Number(a) > b,
    add: (a, b) => a + b,
    eq: (a, b) => a === b,
    add: (a, b) => Number(a) + Number(b),
    formatFullDate(date) {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0'); // Month bắt đầu từ 0
      const year = d.getFullYear();

      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12; // 12 AM / 12 PM
      const strHours = String(hours).padStart(2, '0');

      return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
    },
    gte: (a, b) => Number(a) >= b,
    section: expressHandlebarsSections()
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(attachLayoutData)

app.get('/', (req, res) => {
  //let endingSoon = await auctionService.getEndingSoon();
  //let mostBids = await auctionService.getMostBids();
  //let highestPrice = await auctionService.getHighestPrice();

  let endingSoon
  let mostBids
  let highestPrice
  // ==== Fake data khi trống ====
  if (!endingSoon || endingSoon.length === 0) {
      endingSoon = [
          { id: 1, title: "iPhone 14 Pro Max", image: "/img/sample1.jpg", currentBid: 25000000, endTime: "10 phút nữa", description: "Like new 99%" },
          { id: 2, title: "Laptop ASUS ROG", image: "/img/sample2.jpg", currentBid: 30000000, endTime: "15 phút nữa", description: "Core i9, RTX 4070" },
          { id: 3, title: "Rolex Submariner", image: "/img/sample3.jpg", currentBid: 120000000, endTime: "20 phút nữa", description: "Bản Limited" },
          { id: 4, title: "AirPods Pro 2", image: "/img/sample4.jpg", currentBid: 4500000, endTime: "25 phút nữa", description: "VN/A" },
          { id: 5, title: "Sony A7IV", image: "/img/sample5.jpg", currentBid: 42000000, endTime: "30 phút nữa", description: "Fullbox" }
      ];
  }

  if (!mostBids || mostBids.length === 0) {
      mostBids = [
          { id: 6, title: "PS5 Slim", image: "/img/sample6.jpg", currentBid: 10500000, bidCount: 32, description: "Kèm tay cầm" },
          { id: 7, title: "MacBook Pro M2", image: "/img/sample7.jpg", currentBid: 28000000, bidCount: 28, description: "RAM 16GB" },
          { id: 8, title: "Jordan 1 Retro", image: "/img/sample8.jpg", currentBid: 6500000, bidCount: 25, description: "Size 42" },
          { id: 9, title: "GoPro Hero 12", image: "/img/sample9.jpg", currentBid: 9000000, bidCount: 22, description: "Mới 100%" },
          { id: 10, title: "Samsung S24 Ultra", image: "/img/sample10.jpg", currentBid: 23000000, bidCount: 20, description: "Chưa active" }
      ];
  }

  if (!highestPrice || highestPrice.length === 0) {
      highestPrice = [
          { id: 11, title: "Mercedes C300", image: "/img/sample11.jpg", currentBid: 1650000000, description: "Đời 2021" },
          { id: 12, title: "PC RTX 4090", image: "/img/sample12.jpg", currentBid: 88000000, description: "Full cấu hình cao cấp" },
          { id: 13, title: "Tủ rượu Nhật 1960", image: "/img/sample13.jpg", currentBid: 72000000, description: "Đồ sưu tầm hiếm" },
          { id: 14, title: "Rolex Day-Date", image: "/img/sample14.jpg", currentBid: 650000000, description: "Vàng 18K" },
          { id: 15, title: "SH 350i", image: "/img/sample15.jpg", currentBid: 125000000, description: "Odo 5.000km" }
      ];
  }

  res.render("home", {
      endingSoon,
      mostBids,
      highestPrice
  });
});

app.get('/test', (req, res) => { 



  res.render('test',
    {
      isBuyer: false,
      isSeller: true,

      product: {
        image: "https://picsum.photos/300/300?random=5",
        name: "MacBook Pro M2 14-inch",
        finalPrice: "32.500.000 ₫",
        endTime: "02/01/2026 09:30 PM"
      },

      order: {
        id: "ORD-20260102-001",
        step: 2 // 1: Thanh toán | 2: Vận chuyển | 3: Nhận hàng | 4: Đánh giá
      },

      seller: {
        name: "Nguyễn Văn A",
        rating: 4.8,
        totalTransactions: 152
      },

      buyer: {
        name: "Trần Thị B",
        rating: 4.6,
        totalTransactions: 87
      },

      messages: [
        {
          sender: "buyer",
          content: "Chào bạn, mình đã thanh toán rồi nhé.",
          time: "02/01/2026 08:15 PM"
        },
        {
          sender: "seller",
          content: "Mình xác nhận đã nhận tiền, sẽ gửi hàng hôm nay.",
          time: "02/01/2026 08:20 PM"
        },
        {
          sender: "buyer",
          content: "Ok bạn, nhớ đóng gói kỹ giúp mình.",
          time: "02/01/2026 08:22 PM"
        },
        {
          sender: "seller",
          content: "Yên tâm nhé, mình gửi bằng GHTK.",
          time: "02/01/2026 08:25 PM"
        }
      ]
    }
    
  );
});

app.get('/test2', (req, res) => {

  
  res.render('Accounts/externalprofile',
    {
  "reviews": [
    {
      "reviewer_name": "Nguyễn Văn A",
      "created_at": "2025-01-02",
      "rating": 5,
      "auction_title": "iPhone 13 Pro Max 256GB",
      "comment": "Seller rất uy tín, đóng gói cẩn thận.",
      "reply": "Cảm ơn bạn đã ủng hộ shop!",
      "reply_date": "2025-01-03"
    },
    {
      "reviewer_name": "Trần Thị B",
      "created_at": "2025-01-01",
      "rating": 4,
      "auction_title": "MacBook Air M1",
      "comment": "Giao hàng nhanh, sản phẩm đúng mô tả.",
      "reply": null,
      "reply_date": null
    },
    {
      "reviewer_name": "Trần Thị B",
      "created_at": "2025-01-01",
      "rating": 4,
      "auction_title": "MacBook Air M1",
      "comment": "Giao hàng nhanh, sản phẩm đúng mô tả.",
      "reply": null,
      "reply_date": null
    },
    {
      "reviewer_name": "Trần Thị B",
      "created_at": "2025-01-01",
      "rating": 4,
      "auction_title": "MacBook Air M1",
      "comment": "Giao hàng nhanh, sản phẩm đúng mô tả.",
      "reply": null,
      "reply_date": null
    },
    {
      "reviewer_name": "Trần Thị B",
      "created_at": "2025-01-01",
      "rating": 4,
      "auction_title": "MacBook Air M1",
      "comment": "Giao hàng nhanh, sản phẩm đúng mô tả.",
      "reply": null,
      "reply_date": null
    },
    {
      "reviewer_name": "Trần Thị B",
      "created_at": "2025-01-01",
      "rating": 4,
      "auction_title": "MacBook Air M1",
      "comment": "Giao hàng nhanh, sản phẩm đúng mô tả.",
      "reply": null,
      "reply_date": null
    },
    {
      "reviewer_name": "Trần Thị B",
      "created_at": "2025-01-01",
      "rating": 4,
      "auction_title": "MacBook Air M1",
      "comment": "Giao hàng nhanh, sản phẩm đúng mô tả.",
      "reply": null,
      "reply_date": null
    }
  ],
  "page": 1,
  "limit": 2,
  "hasMore": true
}
  );
});
app.use('/accounts', accountRouter);
app.use('/products', productRouter);
app.use('/seller',  sellerRouter);
app.use('/buyer',  buyerRouter);
app.use('/admin',  adminRouter);
app.use('/orders', orderRouter);

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});