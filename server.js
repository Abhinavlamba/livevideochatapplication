var express = require('express');
var app = express();
var pg = require('pg');
var passport = require("passport");
const multer = require('multer');
// var nconf = require('nconf');
// nconf.use('file', { file: './config.json' });
// nconf.load();
var profilePicture = new Date().toISOString().replace(/:/g, '-');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, __dirname + '/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, profilePicture + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});
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
app.use(express.static(__dirname + '/uploads/'));
app.get('/', function(req, res) {
    users = []
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
    // io.sockets.emit('update user', users);
    res.render(__dirname + '/static/index.ejs');
});
var prev;
app.post('/users/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        // console.log(user)
        if (user) {
            var json = {
                'relations': [],
                'users': []
            };
            pool.query(`SELECT * FROM relations`, function(err, results) {
                if (err)
                    return res.send(400);
                console.log(results.rows + '1');
                for (var i = 0; i < results.rows.length; i++) {
                    (json.relations).push(results.rows[i]);
                }
                for (var i = 0; i < users.length; i++) {
                    json.users.push(users[i]);
                }

                var result = JSON.stringify(json);
                // console.log(result);
                return res.send(result);
            })
        } else {
            return res.send(400);
        }
        // switch (req.accepts('html', 'json')) {
        //     case 'html':
        //         if (err) { return next(err); }
        //         if (!user) { return res.redirect('/login'); }
        //         req.logIn(user, function(err) {
        //             if (err) { return next(err); }
        //             return res.redirect('/profile');
        //         });
        //         break;
        //     case 'json':
        //         console.log('here');
        //         if (err) { return next(err); }
        //         if (!user) { return res.status(401).send({ "ok": false }); }
        //         req.logIn(user, function(err) {
        //             if (err) { return res.status(401).send({ "ok": false }); }
        //             return res.send({ "ok": true });
        //         });
        //         break;
        //     default:
        //         res.status(406).send();
        // }
    })(req, res, next);
});
app.get("/users/register", (req, res) => {
    res.render(__dirname + '/static/register.ejs');
});
app.post("/users/register", upload.single('profileImage'), async(req, res) => {
    // console.log(req.file);
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
    if (req.file.mimetype != "image/jpeg" && req.file.mimetype != "image/png") {
        errors.push({ message: "jpeg, png formats are supported" });
    }
    if (errors.length > 0) {
        res.render(__dirname + '/static/register.ejs', { errors, name, email, password, password2 });
    } else {
        hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        // Validation passed
        name = name.replace(/ /g, '-');
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
                        `INSERT INTO users (name, email, password, image)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id, password`, [name, email, hashedPassword, profilePicture + req.file.originalname],
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
app.post("/profile", function(req, res) {
    console.log(req.body)
    prev = req.body.email;
    console.log(prev)
    return res.send(200);
})
app.post("/users/update", upload.single('profileImage'), async function(req, res) {
    var { name, password, email, prevemail, prevname, previmage, previd } = req.body;
    console.log(req.body.prevemail);
    console.log(req.file);
    name = name.replace(/ /g, '-');
    console.log(req.body);
    console.log(name);
    hashedPassword2 = await bcrypt.hash(password, 10);
    console.log(hashedPassword2);
    pool.query(
        `SELECT * FROM users WHERE email = ($1)`, [email], (err, results) => {
            if (err) {
                throw err;
            }
            console.log(results.rows);
            if (results.rows.length == 1) {
                console.log(prevemail + ' ' + email);
                if (prevemail != email)
                    return res.send(400);
            }
            pool.query(
                `UPDATE users SET name = ($1), email = ($2), password = ($3), image = ($4)
                WHERE email = ($5)`, [name, email, hashedPassword2, profilePicture + req.file.originalname, prevemail],
                (err, results2) => {
                    if (err) {
                        throw err;
                    }
                    console.log(results2.rows);
                    pool.query(`SELECT * FROM users`, function(err, results) {
                            if (err)
                                return res.send(400);
                            users = [];
                            var json = { users: [] };
                            for (var i = 0; i < results.rows.length; i++) {
                                json.users.push(results.rows[i]);
                                users.push(results.rows[i]);
                            }
                            var result = JSON.stringify(json);
                            return res.send(result);
                        })
                        // return res.send(200);
                }
            );
        }
    )
})
app.post('/users/info', function(req, res) {
    users = [];
    pool.query(`SELECT * FROM users`, function(err, results) {
        if (err)
            res.send(400);

        for (var i = 0; i < results.rows.length; i++) {
            users.push(results.rows[i]);
        }
        var result = JSON.stringify(users);
        return res.send(result);

    })
})
app.post('/users/remove', function(req, res) {
        var usertype = req.body.type;
        console.log(usertype);
        if (usertype == 'friend') {
            usertype = 0;
        } else if (usertype == 'buissness') {
            usertype = 1;
        } else {
            usertype = 2;
        }
        var user_id = req.body.user_id1;
        var friend_id = req.body.user_id2;
        console.log(user_id + ' ' + friend_id + ' ' + usertype);
        pool.query(`DELETE FROM relations WHERE user_id1 = $1 AND user_id2 = $2 AND type = $3`, [user_id, friend_id, usertype], (err, results) => {
            if (err)
                return res.send(400);
            pool.query(`SELECT * FROM relations`, function(err, results) {
                var json = { relations: [] }
                for (var i = 0; i < results.rows.length; i++) {
                    json.relations.push(results.rows[i]);
                }
                var result = JSON.stringify(json);
                // io.sockets.emit('update relations', result);
                return res.send(result);
            })
        })

    })
    // app.post('/users/profile', function(req, res) {
    //     result = req.body.profiledata.split('$');
    //     console.log(result)
    //         // var user = users.filter(function(chain) {
    //         //     return chain.email === result[0]
    //         // })
    //     return res.render(__dirname + '/static/profile.ejs', { name: result[1], email: result[0], profilepicture: result[2] });
    //     // return res.send(200)
    // })
app.post('/users/addcontact', function(req, res) {
    console.log(req.body);
    var { name, email } = req.body;
    console.log(name + email);
    // return res.send(200);
    pool.query(`SELECT * FROM users 
    WHERE name = ($1) AND email = ($2)`, [name, email],
        (err, results) => {
            if (err)
                return res.send(400);
            if (results.rows.length == 0)
                return res.send(400);
            console.log(results.rows)
            var user_id = req.body.id;
            var friend = results.rows[0];
            console.log(friend)
            var friend_id = friend.id;
            var type = req.body.type;
            var table_name = 'friends';
            var other_id = 'friend_id';
            if (type == 'friend')
                type = 0;
            else if (type == 'buissness')
                type = 1;
            else
                type = 2;
            if (true) {
                pool.query(`INSERT INTO relations (user_id1, user_id2, type) VALUES (($1), ($2), ($3))`, [user_id, friend_id, type], function(err, results) {
                    // console.log(err.message);
                    if (err)
                        return res.send(400);
                    var json = { id: 'abcd', type: 0 };
                    json.id = friend_id;
                    json.type = type;
                    var jsonid = JSON.stringify(json);
                    console.log(jsonid);
                    return res.send(jsonid);
                })
            }
        });
    // return res.send(200);
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
            if (data == presentuser[i]) {
                return callback(false);
            }
        }
        if (true) {
            callback(true);
            socket.username = data;
            console.log(users);
            var result = users.filter(function(chain) {
                return chain.email === data
            })[0];
            // socket.username += '$' + result.name + '$' + result.image;
            // console.log(result.name);
            currentuser = socket.username;
            // console.log(socket.name);
            userlist[socket.username] = socket;
            // io.sockets.emit('update user')
            updateUserList();
        }
    });
    socket.on('update user', function(callback) {
        console.log('update user');
        var json = { users: [] };
        for (var i = 0; i < users.length; i++) {
            json.users.push(users[i]);
        }
        var result = JSON.stringify(json);
        io.sockets.emit('user', result);
        callback(true);
    })

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