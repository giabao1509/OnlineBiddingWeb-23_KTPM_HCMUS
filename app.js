import express from 'express';
import { engine } from 'express-handlebars';
import expressHandlebarsSections from 'express-handlebars-sections';
import accountRouter from './routes/account.route.js';
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('handlebars', engine({
  helpers: {
    format_currency(value) {
      return new Intl.NumberFormat('en-US').format(value);
    },
    section: expressHandlebarsSections()
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');


app.get('/', (req, res) => {
    res.render('Accounts/signup');
});



app.use('/accounts', accountRouter);

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});