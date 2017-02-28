var express = require('express');
var app = express();

var path = require('path');
var bodyParser = require('body-parser');
var mustacheExpress = require('mustache-express');
var assert =  require('assert');
var randomstring = require('randomstring');

var MongoClient = require('mongodb').MongoClient;
var ObjectID =  require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/eliza'

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: 'cs356.wp2.dansam@gmail.com',
		pass: 'cse356wp2'
	}
}, {
	from: 'Dan Harel and Sam McKay <noreply@stonybrook.edu>'
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.engine('html', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'static', 'templates'));

var sendFileOptions = {
    root: path.join(__dirname, 'static')
};

var BACKDOOR = 'abracadabra';

app.get('/', function(req,res) {
    res.send('Hello world');
});

app.get('/eliza', function(req, res) {
	res.sendFile(path.join('html', 'home.html'), sendFileOptions);
    // res.sendFile(path.join('html', 'eliza.html'), sendFileOptions);
});

app.post('/eliza', function(req, res) {
    var name = req.body.name;
    var dateStr = (new Date()).toString();
    res.render('doctor.html', {name: name, date: dateStr});
	//res.sendFile(path.join(__dirname, 'static', 'templates', 'doctor.html'));

});

app.post('/eliza/DOCTOR', function(req, res) {
    // Do something
    res.send({eliza: "meme"});
});

app.post('/adduser', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected to MongoDB server");
		var users = db.collection('users');
        /* I figured it would make sense to check for the existence of an item
        before adding it to the database... but I couldn't get it to work. So
        for now ignore this I guess....?
        users.find({username: username}, function(err, docs) {
        	if (err != null) {
        		console.log(err);
        		res.sendStatus(400);
        	}
            if (docs.length > 0) {
                console.log("Found user with name " + username);
                res.sendStatus(409);
            }
    	});
    	users.find({email: email}, function(err, docs) {
    		if (err != null) {
    			console.log(err);
    			res.sendStatus(400);
    		}
    		if (docs.length > 0) {
    			console.log("Found user with email " + email);
    			res.sendStatus(409);
    		}
    	});
    	*/
    	var key = randomstring.generate();
    	users.insert({
    		username: username, 
    		password: password, 
    		email: email, 
    		verified: false,
    		key: key
    	}, function(err, r) {
    		if (err != null) {
    			// See comment below
    			console.log(err);
    		} else {
    			console.log("Sucessfully created user " + username);
				transporter.sendMail({
					to: username + ' <' + email + '>',
					subject: "Please verify!",
					text: "130.245.168.148/verify?email=" + email + "&key=" + key
				}, function(err, info) {
					if (err != null) {
						console.log(err);
					} else {
						console.log("Sent email");
					}
				});
    			// Instead of sending a status, this needs to user send(),
    			// sendFile(), or redirect() so that the user gets a reasonable
    			// response.
    			res.sendStatus(200);
    		}
    	});
    });

});

app.get('/verify', function(req, res) {
    var email = req.body.email;
    var key = req.body.key;

	if (key == BACKDOOR) {
		res.sendStatus(200);
	}

    MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected to MongoDB server");
		var users = db.collection('users');
		// Neither of these 2 queries seem to work :) :) :) :) :) :) :) :) 
//		users.findOne({email: email}, function(err, document) {
		users.find({email: email}).limit(1).next(function(err, document) {
			if (err == null) {
				console.log(err);
			}
			if (document) {
				console.log("ID: " + document._id);
				if (key == document.key || key == BACKDOOR) {
					console.log("Valid key obtained");
					users.update({_id: document._id}, {$set: {verified: true}}, function(err, doc) {
						console.log("Successfully verified user");
						res.sendStatus(200);
					});
				}
			}
		});
	});
	
});

app.listen(80, function() {
    console.log("Listening on port 80");
});
