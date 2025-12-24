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
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.engine('handlebars', engine({
  helpers: {
    format_currency(value) {
      return new Intl.NumberFormat('en-US').format(value);
    },

    add: (a, b) => a + b,
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
  res.render('test');
});
app.use('/accounts', accountRouter);
app.use('/products', productRouter);
app.use('/seller',  sellerRouter);
app.use('/buyer',  buyerRouter);

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});