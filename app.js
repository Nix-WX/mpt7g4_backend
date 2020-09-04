const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;

const UserRoutes = require('./api/routes/user');
const ShopRoutes = require('./api/routes/shop');
const HistoryRoutes = require('./api/routes/history');


// connect to database
mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Assigning routes
app.use('/user', UserRoutes);
app.use('/shop', ShopRoutes);
app.use('/history', HistoryRoutes);

app.get('/', (req, res, next) => {
    res.status(200).json({
        message: 'welcome'
    });
});

// If no route is found
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});


// Handle error come to this point
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;