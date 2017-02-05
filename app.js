var express = require('express');
var app = express();

var path = require('path');
var bodyParser = require('body-parser');
var mustacheExpress = require('mustache-express');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.engine('html', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'static', 'templates'));

sendFileOptions = {
    root: path.join(__dirname, 'static')
};

app.get('/', function(req,res) {
    res.send('Hello world');
});

app.get('/eliza', function(req, res) {
    res.sendFile(path.join('html', 'eliza.html'), sendFileOptions);
});

app.post('/eliza', function(req, res) {
    var name = req.body.name;
    var dateStr = (new Date()).toString();
    //res.send("Hello " + name + ", " + dateStr);
    res.render('doctor.html', {name: name, date: dateStr});
});

app.post('/eliza/DOCTOR', function(req, res) {
    // Do something
    res.send({eliza: "meme"});
});

app.listen(80, function() {
    console.log("Listening on port 80");
});
