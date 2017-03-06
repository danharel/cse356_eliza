var express = require('express');
var app = express();

var path = require('path');
var bodyParser = require('body-parser');
var mustacheExpress = require('mustache-express');
var assert =  require('assert');
var randomstring = require('randomstring');
var session = require('client-sessions');

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

var speechCounter = 0;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(session({
	cookieName: 'session',
	secret: randomstring.generate(),
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
}));
//app.use(function(req, res, next) {
//	console.log("meme");
//	if (req.session && req.session.user) {
//		MongoClient.connect(url, function(err, db) {
//			assert.equal(null, err);
//			console.log("Connected to MongoDB server");
//			var users = db.collection('users');
//			users.findOne({username: req.session.username}, function(err, result) {
//				if (err)
//					res.sendStatus(400);
//				else if (!result) {
//					console.log("Cannot find user");
//					req.session.reset();
//					res.redirect('/login');
//				}
//				else if (!result.verified) {
//					res.redirect('/html/verify.html');
//				}
//				else
//					next();
//			});
//		});
//	}
//});

app.engine('html', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'static', 'templates'));

var sendFileOptions = {
    root: path.join(__dirname, 'static')
};

var BACKDOOR = 'abracadabra';

var SUCCESS =  {status: "OK", message: "Success"};
var ERROR = {status: "ERROR"};

app.get('/', function(req, res) {
	// res.sendFile(path.join('html', 'eliza.html'), sendFileOptions);
    // res.sendFile(path.join('html', 'eliza.html'), sendFileOptions);
    MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected to MongoDB server");
		if (req.session && req.session.username) {
			var users = db.collection('users');
			users.findOne({username: req.session.username}, function(err, result) {
				if (!result) {
					req.session.reset();
					res.redirect('/html/login.html');
				}
				else if (!result.verified) {
					res.redirect('/html/verify.html');
				}
				else {
					var dateStr = currentTime();
					var convos = result.conversations ? result.conversations : [];
					var conversations = db.collection('conversations')
					conversations.insert({start_date: dateStr, conversations: []}, function(err, records) {
						var id = records.ops[0]._id;
						//convos.push(id);
						req.session.id = id;
						users.update(
							{username: req.session.username},
							{$push:
								{conversations: id}
							}
						);
						res.render('doctor.html', {name: result.username, date: dateStr});
					});
				}
			});
		}
		else {
			res.redirect('/html/login.html');
		}
	});

});

app.post('/', function(req, res) {
	speechCounter = 0;
    var name = req.body.name;
    var dateStr = (new Date()).toString();
    res.render('doctor.html', {name: name, date: dateStr});
	//res.sendFile(path.join(__dirname, 'static', 'templates', 'doctor.html'));
});

app.post('/DOCTOR', function(req, res) {
	if (!req.session || !req.session.username) {
		res.send({
			status: "ERROR",
			message: "No valid session. Please login.",
		});
	}

	if (!req.session.id) {
		res.send({
			status: "ERROR",
			message: "No valid conversation id. Please try again.",
		});
	}
	console.log(req.session.id);
		
    // Do something
	var message = req.body.human;
	var userMessageObj = {
		timestamp: currentTime(),
		name: req.session.username,
		text: message,
	}

	var response = "";
	if(speechCounter == 0){
		response = "What seems to be the problem?";
	}
	else if(speechCounter == 1){
		var r = Math.floor(Math.random() * 2 + 1);
		if(r === 0){
			response = "Do you think I'd be able to help you with that? I'd like to try.";
		}
		else{
			response = "Can I assist you with that?";
		}
	}
	else if(speechCounter == 2){
		if(message === "yes" || message === "Yes"){
			var ran = Math.floor(Math.random() * 2 + 1);
			if(ran === 0){
				response = "Great, let's continue. Can you elaborate on the problem?";
			}
			else{
				response = "Wonderful. Please go on.";
			}
		}
		else if(message === "no" || message === "No"){
			var n = Math.floor(Math.random() * 2 + 1);
			if(n === 0){
				response = "That's a shame. Why are you so negative?";
			}
			else{
				response = "I have to say, that's awfully negative of you.";	
			}
		}
		else{
			response = "A simple yes or no will suffice.";
			//speechCounter = 1;
		}
	}
	else{
		/*if(message.indexOf("Sorry") >= 0 || message.indexOf("sorry") >= 0){
			response = "No need to apologize. Let's move on.";
		}
		else if(message.indexOf("Why") >= 0 || message.indexOf("why") >= 0 || message.indexOf("?") >= 0){
			response = "Do you think about this question often?";
		}
		else if(message.indexOf("you") >= 0 || message.indexOf("You") >= 0){
			response = "This is about you, not me.";
		}*/
		//else{
			var rand = Math.floor(Math.random() * 6 + 1);
			if(rand === 0){
			response = "Tell me more about this.";
			}
			else if(rand === 1){
				response = "Let's stay on this topic.";			
			}
			else if(rand === 2){
				response = "Does this subject upset you?";			
			}
			else if(rand === 3){
				response = "This is very interesting.";
			}
			else if(rand === 4){
				response = "Tell me more about this.";
			}
			else if(rand === 5){
				response = "We should discuss this more.";
			}
			else{
				response = "The solution to your problem is to take CSE356. Let's talk about another problem now.";
				speechCounter = 0;
			}
		//}
	}
	speechCounter = speechCounter + 1;
	res.send({eliza: response});

	var elizaMessageObj = {
		timestamp: currentTime(),
		name: "Eliza",
		text: response,
	};

	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected to MongoDB server");
		var conversations = db.collection('conversations');
		conversations.update(
			{_id: ObjectID(req.session.id)},
			{$push: {conversations: { $each: [userMessageObj, elizaMessageObj] } } }
		);
		//conversations.insertMany([userMessageObj, elizaMessageObj]);
	});
});

app.post('/adduser', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected to MongoDB server");
		var users = db.collection('users');
    	var key = randomstring.generate();
    	users.insert({
    		username: username, 
    		password: password, 
    		email: email, 
    		verified: false,
    		key: key,
    		conversations: [],
    	}, function(err, r) {
    		if (err != null) {
    			res.send({
    				status: "ERROR",
    				message: "Unable to create user."
    			});
    		} else {
    			console.log("Sucessfully created user " + username);
				transporter.sendMail({
					to: username + ' <' + email + '>',
					subject: "Please verify!",
					text: "130.245.168.148/html/verify.html?key=" + key + "&email=" + email,
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
    			//res.sendStatus(200);
    			res.send(SUCCESS);
    		}
    	});
    });

});

app.post('/verify', function(req, res) {
    var email = req.body.email;
    var key = req.body.key;
    console.log(email);
    console.log(key);

	// If the backdoor was passed in, then automatically verify the user
	if (key == BACKDOOR) {
		console.log("backdoor received");
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			console.log("Connected to MongoDB server");
			var users = db.collection('users');
			users.findOneAndUpdate(
				{email:email},
				{$set: {verified: true}},
				{},
				function(err, response) {
					console.log(response);
					if (response.lastErrorObject.updatedExisting){
						res.send(SUCCESS);
					}
					else {
						res.send({
							status: "ERROR",
							message: "Failed to verify user. Please contact system administrator.",
						});
					}
				}
			);
		});
	}
	// If the backdoor was not used, verify normally
	else {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			console.log("Connected to MongoDB server");
			var users = db.collection('users');
			// Locate a user with the given email and key
			users.findOneAndUpdate(
				{email:email, key:key},
				{$set: {verified: true}},
				{},
				function(err, response) {
					console.log(response);
					if (response.lastErrorObject.updatedExisting){
						res.send(SUCCESS);
					}
					// If the object was not successfully updated, then the
					// email or key is wrong. Notify the user.
					else {
						res.send({
							status: "ERROR",
							message: "Unable to validate user. Please contact your system administrator.",
						});
						//res.redirect("/html/verifyInvalid.html");
					}
				}
			);
		});
	}
});

app.post('/login', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	MongoClient.connect(url, function(err, db) {
		if (err) {
			res.send({
				status: "ERROR",
				message: "Could not connect to database."
			});
		}
		var users = db.collection('users');
		users.findOne({username: username, password: password}, function(err, result) {
			if (err) {
				res.send({
					status: "ERROR",
					message: "Could not query database."
				});
			}
			else if (!result) {
				// res.redirect('/html/loginInvalid.html');
				// console.log("Invalid username or password");
				res.send({
					status: "ERROR",
					message: "Incorrect username or password."
				});
			}
			else {
				req.session.username = username;
				var dateStr = (new Date()).toString();
				//res.render('doctor.html', {name: username, date: dateStr});
				res.send(SUCCESS);
			}
		});
	});
});

app.post('/logout', function(req, res) {
	req.session.reset();
	//res.redirect('/');
	res.send(SUCCESS);
});

app.post('/listconv', function(req, res) {
    MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected to MongoDB server");
		if (req.session && req.session.username) {
			var users = db.collection('users');
			users.findOne({username: req.session.username}, function(err, result) {
				if (err) {
					res.send({
						status: "ERROR",
						message: "Unable to query database",
					});
				}
				else if (!result) {
					req.session.reset();
					res.send({
						status: "ERROR",
						message: "Error retrieving user data. Please login again.",
					});
				}
				else if (!result.verified) {
					//res.redirect('/html/verify.html');
					res.send({
						status: "ERROR",
						message: "User is not verified.",
					});
				}
				else {
					res.send({
						status: "OK",
						message: "Success",
						conversations: result.conversations,
					});
				}
			});
		}
		else {
			res.send({
				status: "ERROR",
				message: "No valid session.",
			});
		}
	});
});

app.post('/getconv', function(req, res) {
    MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected to MongoDB server");
		var id = req.body.id;
		var conversations = db.collection('conversations');
		conversations.findOne({_id: id}, function(err, result) {
			if (err || !result) {
				res.send({
					status: "ERROR",
					message: "Cannot find conversation with that ID"
				});
			}
			else {
				res.send({
					status: "OK",
					message: "Success",
					conversations: result.conversations
				});
			}
		});
	});
});

// https://stormpath.com/blog/everything-you-ever-wanted-to-know-about-node-dot-js-sessions
function requireLogin(req, res, next) {
	if (!req.user)
		res.redirect('/html/login.html');
	else
		next();
}

function currentTime() {
	return (new Date()).toString();
}

app.listen(80, function() {
    console.log("Listening on port 80");
});
