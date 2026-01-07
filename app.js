import './bootstrap.js'


import express from 'express';
import { engine } from 'express-handlebars';
import expressHandlebarsSections from 'express-handlebars-sections';
import accountRouter from './routes/account.route.js';
import productRouter from './routes/product.route.js';
import {attachLayoutData} from './middlewares/auth.mdw.js';
import cookieParser from 'cookie-parser';
import sellerRouter from './routes/seller.route.js';
import adminRouter from './routes/admin.route.js';
import orderRouter from './routes/order.route.js';
import session from 'express-session';
import * as productService from './services/product.service.js';
import { maskName } from './utils/mask.js';
import { displayTimeRemaining } from './utils/other.js';
import { startAuctionUpdater, startUpgradeRequestCleaner, startOtpCleaner } from './utils/cron.js';
import flash from 'connect-flash';


const PORT = process.env.PORT || 3000;
const app = express();

startOtpCleaner();
startAuctionUpdater();
startUpgradeRequestCleaner()

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
    neq: (a, b) => a !== b,
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

app.get('/', async (req, res) => {
  let endingSoon
  let mostBids
  let highestPrice

  endingSoon = await productService.getTop5EndingSoonAuctions();

  endingSoon.forEach(p => {
          p.time_remaining = displayTimeRemaining(p.end_time);
          if (p.top_bidder_name) {
              p.top_bidder_name = maskName(p.top_bidder_name);
          }
          p.isNew = (Date.now() - new Date(p.created_at).getTime()) < 2 * 24 * 60 * 60 * 1000;
  });

  endingSoon.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
  
  mostBids = await productService.getTop5MostBidsAuctions();
  mostBids.forEach(p => {
          p.time_remaining = displayTimeRemaining(p.end_time);
          if (p.top_bidder_name) {
              p.top_bidder_name = maskName(p.top_bidder_name);
          }
          p.isNew = (Date.now() - new Date(p.created_at).getTime()) < 2 * 24 * 60 * 60 * 1000;
  });
  
  highestPrice = await productService.getTop5HighestPriceAuctions();
  highestPrice.forEach(p => {
          p.time_remaining = displayTimeRemaining(p.end_time);
          if (p.top_bidder_name) {
              p.top_bidder_name = maskName(p.top_bidder_name);
          }
          p.isNew = (Date.now() - new Date(p.created_at).getTime()) < 2 * 24 * 60 * 60 * 1000;
  });

  res.render("home", {
      endingSoon,
      mostBids,
      highestPrice
  });
});




app.use('/accounts', accountRouter);
app.use('/products', productRouter);
app.use('/seller',  sellerRouter);
app.use('/admin',  adminRouter);
app.use('/orders', orderRouter);

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});