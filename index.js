const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const ejsMate = require('ejs-mate');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const OldBook = require('./models/books');
const User = require('./models/user');
mongoose.connect('mongodb://127.0.0.1:27017/books');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Databse Connected")
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(flash());
app.engine('ejs', ejsMate);


const sessionConfig = {
    secret: 'thisisasecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(flash());
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');
    next();
})

const isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const book = await OldBook.findById(id).populate('owner');
    if (!book.owner.equals(req.user._id)) {
        req.flash('error', 'You Do Not Have The Permission To Do That');
        return res.redirect(`/showbook/${book._id}`);
    }
    next();
}
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You Must Be Signed In');
        return res.redirect('/login');
    }
    next();
}

app.get('/', isLoggedIn, (req, res) => {
    res.render('home');
})

app.get('/profile', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id.toString());
    const books = await OldBook.find({ owner: req.user._id.toString() });
    res.render('profile', { books, user });
})

app.delete('/profile', isLoggedIn, async (req, res) => {
    const userid = req.user._id.toString();
    await OldBook.deleteMany({ owner: userid });
    await User.findByIdAndDelete(userid);
    req.flash('success', 'Successfully Deleted Account');
    res.redirect('/login');
})

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        req.flash('success', 'Welcome Back To OldBuy');
        return res.redirect('/');
    }
    res.render('login');
});
app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'Welcome Back To OldBuy');
    res.redirect('/');
})
app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Good Bye!');
        res.redirect('/login');
    });
})


app.get('/register', (req, res) => {
    res.render('register')
})
app.post('/register', catchAsync(async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to OldBuy');
            res.redirect('/');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}));

app.get('/book/sell', isLoggedIn, (req, res) => {
    res.render('new');
})

app.post('/book/sell', isLoggedIn, catchAsync(async (req, res) => {
    if (!req.body.book) throw new ExpressError('Invalid Book Data', 400);
    try {
        const book = new OldBook(req.body.book);
        book.owner = req.user._id;
        await book.save();
        req.flash('success', 'Successfully Created Entry for Book');
        res.redirect(`/showbook/${book._id}`)
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/book/sell');
    }
}))

app.get('/showbooks/:category', isLoggedIn, catchAsync(async (req, res) => {
    const { category } = req.params;
    let books;
    if (req.query.q) {
        var re = new RegExp('^.*' + req.query.q + '.*$', 'i');
        books = (category == "all") ? await OldBook.find({ $or: [{ name: re }, { author: re }, { publisher: re }] }) : await OldBook.find({ $and: [{ category: category }, { $or: [{ name: re }, { author: re }, { publisher: re }] }] });
    }
    else {
        books = (category == "all") ? await OldBook.find() : await OldBook.find({ category });
    }
    if (!books.length) {
        req.flash('info', 'No Record Found');
        res.redirect('/');
    } else
        res.render('showbooks', { books, category });

}))

app.get('/showbook/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    const book = await OldBook.findById(id).populate('owner');
    if (!book) {
        req.flash('info', 'No Record Found')
        res.redirect('/showbooks/all')
    }
    res.render('showbook', { book });
}))

app.get('/showbook/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    const book = await OldBook.findById(id);
    if (!book) {
        req.flash('error', 'Cannot Find The Book');
        return redirect('/');
    }
    res.render('edit', { book });
}))

app.put('/showbook/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    if (!req.body.book) throw new ExpressError('Invalid Book Data', 400);
    const { id } = req.params;
    try {
        const { id } = req.params;
        const book = await OldBook.findByIdAndUpdate(id, { ...req.body.book }, { runValidators: true });
        req.flash('success', 'Successfully Updated Book Details');
        res.redirect(`/showbook/${book._id}`);
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect(`/showbook/${id}/edit`);
    }
}))

app.delete('/showbook/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await OldBook.findByIdAndDelete(id);
    req.flash('info', 'Book Has Been Deleted');
    res.redirect('/');
}))

app.all('*', isLoggedIn, (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).render('error', { err });
})


app.listen(3000, () => {
    console.log('Serving on port 3000');
})   