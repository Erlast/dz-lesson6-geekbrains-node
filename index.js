/**
 * Created by Женя on 19.03.2016.
 */

var todolist = require('./modules/todolist.js').todolist;
var express = require('express');
var bodyParser = require('body-parser');
var template = require('consolidate').handlebars;
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var passport = require('passport');
var LocalStratagy = require('passport-local');
var FacebookStrategy = require('passport-facebook');

var app = express();

var server = app.listen(8000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Server was running on: ", host, port);
});

app.engine('hbs', template);
app.set('view engine', 'hbs');
app.set('views', __dirname + "/views");
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser());
app.use(session({keys: ['key']}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStratagy(function (username, pass, done) {
    if (username !== 'admin') {
        return done(null, false)
    }
    else if (pass !== 'admin') {
        return done(null, false)
    } else {
        return done(null, {username: username});
    }
}));

passport.use(new FacebookStrategy({
        clientID: '1680139982242077',
        clientSecret: '19766b5f299976495ffa9b9410732824',
        callbackURL: "http://localhost:8000/auth/facebook/callback"
    },
    function (accessToken, refreshToken, profile, cb) {
       //User.findOrCreate({facebookId: profile.id}, function (err, user) {
        return cb(null, profile);
       // });
    }
));

passport.serializeUser(function (user, done) {
    return done(null, user);
});

passport.deserializeUser(function (id, done) {
    return done(null, id);
});

var auth = passport.authenticate('local', {
    successRedirect: '/workBD',
    failureRedirect: '/login',
});

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/workBD');
    });

app.get('/', function (req, res, next) {
    res.render("index");
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', auth);

app.get('/workBD', mustBeAuthentificated, function (req, res) {
    todolist.list(function (result) {
        res.render('workBD', {'result': result});
    })
});

app.get('/add', function (req, res) {
    todolist.add("Задание");
    res.redirect("/workBD");
})

app.get('/delete', mustBeAuthentificated, function (req, res) {
    todolist.delete(req.query.id);
    res.redirect("/workBD");
})

app.get('/complete', mustBeAuthentificated, function (req, res) {
    todolist.complete(req.query.id);
    res.redirect("/workBD");
})

app.get('/change', mustBeAuthentificated, function (req, res) {
    todolist.change(req.query.id, "Задание " + req.query.id);
    res.redirect("/workBD");
})

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/workBD');
});

function mustBeAuthentificated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
}
