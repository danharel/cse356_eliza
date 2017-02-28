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

var speechCounter = 0;

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
	speechCounter = 0;
    var name = req.body.name;
    var dateStr = (new Date()).toString();
    res.render('doctor.html', {name: name, date: dateStr});
	//res.sendFile(path.join(__dirname, 'static', 'templates', 'doctor.html'));

});

app.post('/eliza/DOCTOR', function(req, res) {
    // Do something
	var message = req.body.human;
	if(speechCounter == 0){
		res.send({eliza: "What seems to be the problem?"});
	}
	else if(speechCounter == 1){
		var r = Math.floor(Math.random() * 2 + 1);
		if(r === 0){
			res.send({eliza: "Do you think I'd be able to help you with that? I'd like to try."});
		}
		else{
			res.send({eliza: "Can I assist you with that?"});
		}
	}
	else if(speechCounter == 2){
		if(message === "yes" || message === "Yes"){
			var ran = Math.floor(Math.random() * 2 + 1);
			if(ran === 0){
				res.send({eliza: "Great, let's continue. Can you elaborate on the problem?"});
			}
			else{
				res.send({eliza: "Wonderful. Please go on."});
			}
		}
		else if(message === "no" || message === "No"){
			var n = Math.floor(Math.random() * 2 + 1);
			if(n === 0){
				res.send({eliza: "That's a shame. Why are you so negative?"});
			}
			else{
				res.send({eliza: "I have to say, that's awfully negative of you."});	
			}
		}
		else{
			res.send({eliza: "A simple yes or no will suffice."});
			//speechCounter = 1;
		}
	}
	else{
		/*if(message.indexOf("Sorry") >= 0 || message.indexOf("sorry") >= 0){
			res.send({eliza: "No need to apologize. Let's move on."});
		}
		else if(message.indexOf("Why") >= 0 || message.indexOf("why") >= 0 || message.indexOf("?") >= 0){
			res.send({eliza: "Do you think about this question often?"});
		}
		else if(message.indexOf("you") >= 0 || message.indexOf("You") >= 0){
			res.send({eliza: "This is about you, not me."});
		}*/
		//else{
			var rand = Math.floor(Math.random() * 6 + 1);
			if(rand === 0){
			res.send({eliza: "Tell me more about this."});
			}
			else if(rand === 1){
				res.send({eliza: "Let's stay on this topic."});			
			}
			else if(rand === 2){
				res.send({eliza: "Does this subject upset you?"});			
			}
			else if(rand === 3){
				res.send({eliza: "This is very interesting."});
			}
			else if(rand === 4){
				res.send({eliza: "Tell me more about this."});
			}
			else if(rand === 5){
				res.send({eliza: "We should discuss this more."});
			}
			else{
				res.send({eliza: "The solution to your problem is to take CSE356. Let's talk about another problem now."});
				speechCounter = 0;
			}
		//}
	}
	speechCounter = speechCounter + 1;
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
    var email = req.query.email;
    var key = req.query.key;

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
					if (response.lastErrorObject.updatedExisting)
						res.sendStatus(200);
					else res.sendStatus(403);
				});
		});
	}
	else {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			console.log("Connected to MongoDB server");
			var users = db.collection('users');
			users.findOneAndUpdate(
				{email:email, key:key},
				{$set: {verified: true}},
				{},
				function(err, response) {
					console.log(response);
					if (response.lastErrorObject.updatedExisting)
						res.sendStatus(200);
				});
		});
	}
});

app.listen(80, function() {
    console.log("Listening on port 80");
});
