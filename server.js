var express = require('express');
var app = express();
var pg = require('pg');
var passport = require("passport");
var http = require('http').createServer(app).listen(process.env.PORT || 3000, function() {
    console.log('Application running on port ' + this.address().port);
});
var bcrypt = require("bcrypt");
var io = require('socket.io').listen(http);
var userlist = {};
var liveVideoCalls = {};
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/static/'));
const pool = new pg.Pool({
    connectionString: 'postgres://qiiasxcrgpgser:2d39f0d7f6afcc173a49898c8ca7e75fce3dc0e667b909be7daf2b0d7881c98b@ec2-34-239-241-25.compute-1.amazonaws.com:5432/dabalc6cj7fsc8',
    ssl: true
});

const initializePassport = require("./passportConfig");
var users = []
initializePassport(passport);
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.get('/', function(req, res) {
    pool.query(
        `SELECT * FROM users`,
        (err, results) => {
            if (err) {
                console.log(err);
            }
            console.log(results.rows.length);
            var p = (results.rows).length;
            for (var i = 0; i < p; i++) {
                users.push(results.rows[i]);
            }
        });
    res.render(__dirname + '/static/index.ejs');
});
app.post('/users/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        console.log(user)
        if (user)
            return res.send(200);
        else
            return res.send(400);
        switch (req.accepts('html', 'json')) {
            case 'html':
                if (err) { return next(err); }
                if (!user) { return res.redirect('/login'); }
                req.logIn(user, function(err) {
                    if (err) { return next(err); }
                    return res.redirect('/profile');
                });
                break;
            case 'json':
                console.log('here');
                if (err) { return next(err); }
                if (!user) { return res.status(401).send({ "ok": false }); }
                req.logIn(user, function(err) {
                    if (err) { return res.status(401).send({ "ok": false }); }
                    return res.send({ "ok": true });
                });
                break;
            default:
                res.status(406).send();
        }
    })(req, res, next);
});
app.get("/users/register", (req, res) => {
    res.render(__dirname + '/static/register.ejs');
});
app.post("/users/register", async(req, res) => {
    let { name, email, password, password2 } = req.body;

    let errors = [];

    console.log({
        name,
        email,
        password,
        password2
    });

    if (!name || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password must be at least 6 characters long" });
    }

    if (password !== password2) {
        errors.push({ message: "Passwords do not match" });
    }

    if (errors.length > 0) {
        res.render(__dirname + '/static/register.ejs', { errors, name, email, password, password2 });
    } else {
        hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        // Validation passed
        pool.query(
            `SELECT * FROM users
        WHERE email = $1`, [email],
            (err, results) => {
                if (err) {
                    console.log(err);
                }
                // console.log(results.rows);

                if (results.rows.length > 0) {
                    return res.render(__dirname + '/static/register.ejs', {
                        message: "Email is already registered"
                    });
                } else {
                    pool.query(
                        `INSERT INTO users (name, email, password)
                        VALUES ($1, $2, $3)
                        RETURNING id, password`, [name, email, hashedPassword],
                        (err, results) => {
                            if (err) {
                                throw err;
                            }
                            console.log(results.rows);

                            // req.flash("success_msg", "You are now registered. Please log in");
                            // console.log(__dirname + '/static/index.ejs');
                            return res.redirect('/');

                        }
                    );
                }
            }
        );
    }
});

io.sockets.on('connection', function(socket) {
    console.log('A user has connected!');
    socket.on('new user', function(data, callback) {
        console.log('user wants to connect as ' + data);
        // console.log(userlist)
        var presentuser = Object.keys(userlist);
        console.log(presentuser)
        for (i = 0; i < presentuser.length; i++) {
            console.log(data + ' ' + presentuser[i])
            if (data == presentuser[i].split('$')[0]) {
                callback(false);
            }
        }
        if (true) {
            callback(true);
            socket.username = data;
            console.log(users);
            var result = users.filter(function(chain) {
                return chain.email === data
            })[0];
            socket.username += '$' + result.name;
            // console.log(socket.name);
            userlist[socket.username] = socket;
            updateUserList();
        }
    });

    function updateUserList() {
        io.sockets.emit('users', Object.keys(userlist));
    }
    socket.on('disconnect', function(data) {
        console.log('here');
        if (!socket.username)
            return;
        delete userlist[socket.username];
        updateUserList();
    });
    socket.on('new message', function(data) {
        io.sockets.emit('message', { name: socket.username, msg: data });
    });

    socket.on('newVideoChatRequest', function(data, callback) {
        console.log('Call request from ' + data.sender + ' to ' + data.receiver);
        if (data.receiver in userlist) {
            userlist[data.receiver].emit('newVideoCallRequest', { from: data.sender, to: data.receiver }, function(res) {
                callback(res);
                console.log('Call request from ' + data.sender + ' to ' + data.receiver + ' was ' + res.reason);
            });

        } else {
            callback({ response: false, reason: 'No such user online.' });
        }
    });
    socket.on('hangup', function(data) {
        console.log('User hangup target :' + data);
        io.sockets.emit('hangup', data);
    });
    socket.on('candidate', function(data) {
        console.log('candidate call to ' + data.targetUser + ' with candidate' + data.candidate);
        io.sockets.emit('candidate', data);
    });
    socket.on('offersdp', function(data) {
        console.log('offersdp to ' + data.targetUser + ' with offerSDP' + data.offerSDP);
        io.sockets.emit('offersdp', data);
    });
    socket.on('answersdp', function(data) {
        console.log('answersdp to ' + data.targetUser + ' with answersdp' + data.answerSDP);
        io.sockets.emit('answersdp', data);
    });
});