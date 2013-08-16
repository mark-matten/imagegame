// Node.js modules
var express = require("express")
	, app = express()
	, fs = require('fs')
	, http = require("http").createServer(app)
	, io = require("socket.io").listen(http)
	, nodemailer = require("nodemailer")
	, _ = require("underscore");

var imageArray = new Array;
var participants = [];
var playerCount = 0;

// For sending an email attachment with the referring expressions.  TO-DO:  Get a database such as mongodb to work with nodejitsu instead of sending emails
var smtpTransport = nodemailer.createTransport("SMTP", {
	service: "Gmail",
	auth: {
	   user: "imagegametester@gmail.com",
	   pass: "imagegame"
	}
});

/* Server config */
app.set("ipaddr", "127.0.0.1");

// Connect locally using localhost:9000
app.set('port', 9000)
app.set("views", __dirname + "/views");

// View engine is Jade
app.set("view engine", "jade");
app.use(express.static("public", __dirname + "/public"));
app.use(express.bodyParser());

app.get("/", function(request, response) {
	response.render("index");
});

// POST method to send a message
app.post("/message", function(request, response) {

	var message = request.body.message;

	if(_.isUndefined(message) || _.isEmpty(message.trim())) {
		return response.json(400, {error: "Message is invalid"});
	}

	// Each message contains a message and a name.  incomingMessage event on client-side parses messages
	var name = request.body.name;
	io.sockets.emit("incomingMessage", {message: message, name: name});
	response.json(200, {message: "Message received"});
});

/* Socket.IO events */
io.on("connection", function(socket) {
	
	// Send the image array upon each new connection
	imageArray.push();
	io.sockets.emit("imageArray", {imageArray: imageArray});
	
	// Trigger newConnection event, which updates participants list on the client-side
	socket.on("newUser", function(data) {
		participants.push({id: data.id, name: data.name});
		io.sockets.emit("newConnection", {participants: participants});
	});

	// Trigger userDisconnected event, remove player from participants list on server and client-side
	socket.on("disconnect", function() {  
		participants = _.without(participants,_.findWhere(participants, {id: socket.id}));	
		io.sockets.emit("userDisconnected", {id: socket.id, participants: participants, sender:"system"});
	});
	
	// Send data via email attachment.  TO-DO:  Get a database such as mongodb to work with nodejitsu instead of sending emails
	socket.on('sendEmail', function (data) {  
		// Sends the generated key for Mechanical Turk validation
		if (data.name.split('_:_')[0] == 'Key') {
			smtpTransport.sendMail({
				from: "<imagegametester@gmail.com>",
				to: "<imagegametester@gmail.com>",
				subject: "Unique Key",
				text: "Key: " + data.name.split('_:_')[1]
			});
		}
		
		// When a user disconnects from the game, send an email attachment containing the referring expressions entered for each object
		else if (data.name != '') {
			smtpTransport.sendMail({
				from: "<imagegametester@gmail.com>",
				to: "<imagegametester@gmail.com>",
				subject: "Expression Data",
				text: "Expression data attached.",
				attachments: [{'filename': 'expressionData.txt','contents': data.name}]
			});
		}
	});

});

// Start the http server at port and IP defined before
http.listen(app.get("port"), app.get("ipaddr"), function() {
	console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});

// Reads the input file containing image names and correct locations of objects in images.  Stores the data in imageArray
fs.readFile('inputFileNew.txt',"utf-8", function(err, data){
    if(err){
        console.log(err);
    } 
    imageArray = data.toString().split("\n");
	
	var counter = imageArray.length, temp, index;
    while (counter > 0) {
        index = (Math.random() * counter--) | 0;
        temp = imageArray[counter];
        imageArray[counter] = imageArray[index];
        imageArray[index] = temp;
    }
});