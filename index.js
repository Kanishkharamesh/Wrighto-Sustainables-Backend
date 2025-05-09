const dotenv = require('dotenv').config()
const express = require('express');
const dbConnect = require('./config/dbConnect');
const app = express()
const PORT =process.env.PORT || 5000;
const authRouter = require('./routes/authRoute');
const productRouter = require('./routes/productRoute');
const blogRouter = require('./routes/blogRoute');
const orderRoutes = require('./routes/orderRoutes.js');
const reportRoutes = require('./routes/reportRoutes');
const contactRouter = require('./routes/contactRoute');
const reviewRoutes = require ("./routes/reviewRoutes");
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const cookieParser = require("cookie-parser");
const morgan = require('morgan');

const cors = require('cors');
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

dbConnect();
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/api/user',authRouter);
app.use('/api/product',productRouter);
app.use('/api/blog',blogRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contact', contactRouter);
app.use("/api/reviews", reviewRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () =>{
    console.log(`Server is running at PORT ${PORT}`);
}); 
