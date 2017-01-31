var express = require('express');
var app = express();

var path = require('path');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req,res) {
    res.send('Hello world');
});

app.get('/eliza', function(req, res) {
    res.sendFile('eliza.html', {root: path.join(__dirname, 'static', 'html')});
});

app.post('/eliza', function(req, res) {
    var name = req.body.name;
    var dateStr = (new Date()).toString();
    res.send("Hello " + name + ", " + dateStr);
});

app.post('/eliza/DOCTOR', function(req, res) {
    // Do something
    res.send("some data");
});

app.listen(80, function() {
    console.log("Listening on port 80");
});
