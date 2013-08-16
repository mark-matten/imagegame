var imageArray = new Array; // Stores image names
var imageArrayP1 = new Array; // Stores image names for player 1's images
var imageArrayP2 = new Array; // Stores image names for player 2's images
var locationArray = new Array; // Stores location range of the selected object in each image
var expressionOutput = new Array; // Stores image name, referring expression, and correctness for each image labeled
var randomNumbers = new Array; // Used for selecting a random image index each round

var thisPlayer = ''; // Contains unique string for each player's ID
var players = new Array; // Contains list of all players currently connected to survey
var thisPlayerNum = 0; // The current player's number in the list of all players
var target = 0; // The player number of the other player in the same game
var realPlayerNum; // The current player's number, doesn't change when players swap roles
var realTarget; // The current player's target, doesn't change when players swap roles
var player1Input; // Player 1's referring expression input each round

var imageIndex = 0; // Randomly generated each round, the index of each image in imageArray
var imageCount = 0; // The number of images that have been displayed so far in each game
var rightWrong; // 'Correct' or 'Incorrect' identification correctness
var score = 0; // The number of correct identifications
var oldScore = 0; // The score at last round

var dotCount = 0; // Used to determine if there is a dot currently on the screen 
// Used for calculating location of player 2's click
var	x = -1; 
var y = -1;
var w = -1;
var h = -1;
var xClick = 0;
var yClick = 0;

var expressionString = ''; // The expression entered each round
var time = 0;
var timerId;
var socket; // Client-server connection

// Get a random, non-repeating image from the dataset.  Send the index of this image to the other player.
function swapImage(first) {
	
	// Show the loading screen image when a player connects
	if (first == 1) {
		return 'loadScreen.jpg';
	}
	
	else { 
		// TO-DO:  Fix image count so this is unnecessary 
		if (first == 2) {
			imageCount--;
		}
		imageCount++;
		
		// When the players score, switch their roles.
		if (imageCount > 1 && score > oldScore) {
			oldScore = score;		

			var tempTarget = target;
			target = thisPlayerNum;
			thisPlayerNum = tempTarget;		
			
			sendSwap();
		}
		
		// Once the score reaches a certain value, generate a key for Mechanical Turk
		if (score == 10) {
			makeKey();
		}
	
		// For the player describing the object, the timer starts right when the image is displayed
		if (thisPlayerNum%2 != 0) {
			timerID = setInterval(countdown, 1000);
		}

		img = document.getElementById('mainImage');
		img.alt = "Random image.";
		
		// When the players finish all images
		if (imageCount == imageArray.length && imageCount > 0) {
				img.src = "";
				img.alt = "";
				
				if (thisPlayerNum%2 == 0) {
					var containerButton = document.getElementById('containerButton'); 
					containerButton.removeChild(submitButton); 
					expressionText.innerHTML = 	"";
				}					
					
				var text = document.getElementById('directions');    
				text.innerHTML = 	"You're done with all of the images.";
				clearInterval(timerID);
				socket.disconnect();
				
				return;
		}
		
		if (thisPlayerNum%2 != 0) {
			// Get a random image index for player 1
			imageIndex = randomNumbers[imageCount];
			
			if (imageIndex == '') {
				imageIndex = randomNumbers[++imageCount];
			}
			
			var imageString = imageArrayP1[imageIndex];
			
			// Set the image for player 1 and send the image index to player 2
			img.src = imageString;
			sendImageIndex(imageIndex);
		
		}
	}
}

// Display the score and time for each player.
function countdown() {

	var scoreDisplay = document.getElementById('scoreDisplay');
	
	var timeString = time.toString();
	if (time == 1) {
		timeString += " second"
	}
	else timeString += " seconds"	
	
	scoreDisplay.innerHTML = "Score: " + score.toString() + "  Time: " + timeString;
	
	time++;
}

// Send a referring expression from player 1 to player 2s
function sendString(string) {
	$.ajax({
	url:  '/message',
	type: 'POST',
	dataType: 'json',
	data: {message: string, name: target.toString() + ",expression"}
	});
}

// Send a notification to the other player to swap roles after a correct identification
function sendSwap() {
	$.ajax({
	url:  '/message',
	type: 'POST',
	dataType: 'json',
	data: {message: "SWAP", name: realTarget.toString()}
	});
}

// Send the image index from player 1 to player 2
function sendImageIndex(imageNumber) {
console.log("SENDING");
	$.ajax({
	url:  '/message',
	type: 'POST',
	dataType: 'json',
	data: {message: imageNumber.toString(), name: realTarget.toString() + ",imageIndex"}
	});
}

// Send the position of a click from player 2 to player 1 to display the dot on player 1's screen 
function sendClick(xClick, yClick) {
	$.ajax({
	url:  '/message',
	type: 'POST',
	dataType: 'json',
	data: {message: xClick.toString() + "," + yClick.toString(), name: target.toString() + ",click"}
	});
}

// Notify player 1 that player 2 has submitted the location of the click
function sendSubmitClick(rightWrong) {
	$.ajax({
	url:  '/message',
	type: 'POST',
	dataType: 'json',
	data: {message: rightWrong, name: target.toString() + ",submitClick"}
	});
}

// Load all expressions into an array for output
function sendEmail() {
	expressionString = '';
	for (var i = 0; i < expressionOutput.length; i++) {
		if (expressionOutput[i].split('_,_')[1] != null) {
			expressionString += expressionOutput[i] + '\n';
		}
	}
}

// For player 1 to enter a referring expression
function enterText() {
	// Get player 1's referring expression from the text box
	var textBox = document.getElementById('textBox');
	player1Input = textBox.value;
	document.getElementById('expression').innerHTML = player1Input;

	textBox.value = '';
	if (player1Input == '') {
		alert('You must enter text.');
	}
	else {
		if (imageIndex > 0 && thisPlayerNum%2 != 0) {
			clearInterval(timerID); // Once player 1 enters text, stop the timer
			var scoreDisplay = document.getElementById("scoreDisplay");
			scoreDisplay.innerHTML = "Score: " + score.toString() + "  Time: 0:00";
		}
		sendString(player1Input); // Send the referring expression to player 2
	}
}

// For player 1 to submit the location of the click
function submitClick() {

	// At the beginning of the game, set up the correct display elements for each player
	if (thisPlayerNum%2 == 0 && imageCount == 1) {
		document.getElementById('submitButton').style.visibility = 'visible';
		document.getElementById('containerButton').style.visibility = 'visible';
		document.getElementById('container').style.visibility = 'hidden';
		document.getElementById('textBox').style.visibility = 'hidden';
		swapImage(2);
	}

	if (thisPlayerNum%2 != 0 && imageCount == 0) {
		document.getElementById('submitButton').value = "Submit";
		document.getElementById('expression').innerHTML = 'Enter a description:';
		document.getElementById('textBox').style.visibility = 'visible';
		document.getElementById('containerButton').style.visibility = 'hidden';
		document.getElementById('submitButton').style.visibility = 'hidden';
		swapImage(0);
	}

	else {
		var expressionText = document.getElementById('expression');    
		
		// If there is a valid click and player 1 has entered an expression
		if (dotCount == 1 && w > 0 && h > 0 && x >= 0 && y >= 0 && expressionText.innerHTML != "" && expressionText.innerHTML != "Waiting for other player..." && expressionText.innerHTML != "Enter a description:") {
			// Compare the location of the click with the correct location of the object
			var location = locationArray[imageIndex];
			if (xClick > location[0] && xClick < location[1] && yClick > location[2] && yClick < location[3]) {
				rightWrong = "Correct!";
			}
			else {
				rightWrong = "Incorrect!";
			}
			
			// Once player 2 has submitted the click, clear he timer
			if (thisPlayerNum%2 == 0) {
				clearInterval(timerID);
				var scoreDisplay = document.getElementById("scoreDisplay");
				scoreDisplay.innerHTML = "Score: " + score.toString() + "  Time: 0:00";
			}
			
			// Send the outcome of the click to player 1, and display if the click is correct or incorrect
			sendSubmitClick(rightWrong);
			dispError(rightWrong);

			expressionText.innerHTML = "Waiting for other player...";
		}

		// If player 1 hasn't entered an expression yet
		else if (expressionText.innerHTML == "" || expressionText.innerHTML == "Waiting for other player..." || expressionText.innerHTML == "Enter a description:") {
			alert("You must wait for the other player's description.");
		}
		// If player 2 is trying to submit without first clicking on the image
		else {
			alert("You must make a selection.");
		}
	}
}

// At the end of each round, clear the timer, dot, and expression displays and swap the image
function roundComplete() {	
	time = 0;
	clearInterval(timerID);
	
	var scoreDisplay = document.getElementById("scoreDisplay");
	scoreDisplay.innerHTML = "Score: " + score.toString() + "  Time: 0:00";
			
	resetDot();
	swapImage(0);
	var expressionText = document.getElementById("expression");   
	if (thisPlayerNum%2 == 0) {
		expressionText.innerHTML = "Waiting for other player...";
	}
	var output = document.getElementById('rightWrong');
	output.style.zIndex = -100;
}

// Get location of player 2's click on the image, draw the dot on player 2's screen, and send the location of the click to player 1
$(document).ready(function(){   
	$("#mainImage").click(function(evt) {
		
		if (thisPlayerNum%2 == 0) {
			if (dotCount == 1) {
				resetDot(); // Redraw the dot each time player 2 clicks
			}
			// To account for padding and margins
			var jThis = $(this);
			var offsetFromParent = jThis.position();
			var topThickness = (jThis.outerHeight(true) - jThis.height()) / 2;
			var leftThickness = (jThis.outerWidth (true) - jThis.width()) / 2;

			x = Math.round(evt.pageX - offsetFromParent.left - leftThickness);
			y = Math.round(evt.pageY - offsetFromParent.top  - topThickness);

			w = $("#mainImage").width();
			h = $("#mainImage").height();
			
			// The ratio of click coordinates to dimensions is used because it will work with any image size on the client-side
			xClick = x / w;
			yClick = y / h;
			
			drawDot(xClick, yClick);
			
			var expressionText = document.getElementById('expression');
			if (expressionText.innerHTML != "" && expressionText.innerHTML != "Waiting for other player...") {
				sendClick(xClick, yClick); // Send the location of the click to player 1
			}
		}
	});
});

// Draw a green dot on the image showing where player 2 clicked
function drawDot(xIn, yIn) {
	w = $("#mainImage").width();
	h = $("#mainImage").height();
		
	var boxPos = getElementPosition(document.getElementById("mainImage"));
	var color = '#00FF00';
	var size = '11px';
	$("#dotContainer").append(
		$('<div></div>')
			.css('position', 'absolute')
			.css('top', yIn*h + boxPos.y - 3 + 'px')
			.css('left', xIn*w + boxPos.x - 3 + 'px')
			.css('width', size)
			.css('height', size)
			.css('background-color', color)
			.css('z-index', 50)
	);
	dotCount = 1;
}

// Removes the dot from the image
function resetDot() {
	$('#dotContainer').html('');
	dotCount = 0;
	x = -1;
	y = -1;
	w = -1;
	h = -1;
}

// Helper function for drawDot(), gets the absolute position of the image
function getElementPosition(theElement) {
	var posX = 0;
	var posY = 0;
			  
	while(theElement != null){
		posX += theElement.offsetLeft;
		posY += theElement.offsetTop;
		theElement = theElement.offsetParent;
	}               		      
	return {x:posX, y:posY};
}

// Display whether the object identification was correct or incorrect
function dispError(rightWrong) {
	$("#rightWrong").html(rightWrong);
	
	if (rightWrong == "Correct!") {
		score++; // Increment the score for both players if player 2 correctly identifies the object
	}
	
	var expressionText = document.getElementById("expression");
	
	// Store the expression and correctness in an array
	if (thisPlayerNum%2 == 0) {
		expressionOutput[imageIndex] += "_,_" + expressionText.innerHTML + "_,_" + rightWrong;
	}
	else if (thisPlayerNum%2 != 0) {
		expressionOutput[imageIndex] += "_,_" + player1Input + "_,_" + rightWrong;
	}
	
	// Display correct or incorrect
	var output = document.getElementById('rightWrong');
	output.style.visibility = "visible";
	output.style.zIndex = 999;
	if (rightWrong == 'Correct!') {
		output.style.color = "green";
	}
	else if (rightWrong == 'Incorrect!') {
		output.style.color = "red";
		if (thisPlayerNum%2 == 0) {
			img = document.getElementById('mainImage');
			img.src = imageArrayP1[imageIndex];
		}
	}
	
	$("#rightWrong").animate({
			opacity: 1
		}, {duration: 500}) ;
	$("#rightWrong").animate({opacity:0}, {duration: 2500});
	
	setTimeout('roundComplete();', 1500);
}

// Generate a random key for users on Mechanical Turk
function makeKey() {
    var key = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < 7; i++) {
        key += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	// Display the key both in the direction text and as an alert
	var text = document.getElementById('directions');    
	text.innerHTML += "  Your Mechanical Turk key is: " + key;
	alert("Your Mechanical Turk key is: " + key);

    socket.emit('sendEmail', {id: 'sendingKey', name: "Key_:_" + key}); // Send the key in an email so that its authenticity can be verified
}

// Shuffle the random number array
function shuffle(input) {
	for(var j, x, i = input.length; i; j = parseInt(Math.random() * i), x = input[--i], input[i] = input[j], input[j] = x);
	return input;
};

// Switch the display elements of the two players when they switch roles
function swapPlayers() {
console.log("SWAPPING");

	var textBoxDiv = document.getElementById('container');
	var textBox = document.getElementById('textBox');
	var buttonDiv = document.getElementById('containerButton');
	var submitButton = document.getElementById('submitButton');
	var expression = document.getElementById('expression');
	var directions = document.getElementById('directions');

	if (textBoxDiv.style.visibility == 'hidden') {
		textBoxDiv.style.visibility = 'visible';
		textBox.style.visibility = 'visible';
		buttonDiv.style.visibility = 'hidden';
		submitButton.style.visibility = 'hidden';
		expression.innerHTML = 'Enter a description:';
		directions.innerHTML = 'Enter a description referring to the object bounded by the red box so that the other player will be able to distinguish this object from other similar objects in the image.';
	}
	
	else {
		textBoxDiv.style.visibility = 'hidden';
		textBox.style.visibility = 'hidden';
		buttonDiv.style.visibility = 'visible';
		submitButton.style.visibility = 'visible';
		expression.innerHTML = 'Waiting for other player...';
		directions.innerHTML = 	"Click on the object in the image described by the other player.";
	}
};

// First function called when page is loaded to initialize everything
function loadFile() {

	// Initialize display elements
	var submitButton = document.getElementById('submitButton');    
	submitButton.style.visibility = 'hidden';

	var expression = document.getElementById("expression");
	expression.innerHTML = "Waiting for another player to join...";

	var textBox = document.getElementById("textBox");
	textBox.style.visibility = "hidden";
	
	var output = document.getElementById('rightWrong');
	output.style.visibility = "hidden";

	var img = document.getElementById("mainImage");
	img.src = swapImage(1); // Display the load screen
	
	// Connect to the server
	var serverBaseUrl = document.domain;
	socket = io.connect(serverBaseUrl);
	var sessionId = '';
	
	//Helper function to update the participants list
	function updateParticipants(participants) {
		$('#participants').html('');
		players = participants.slice(0);
		for (var i = 0; i < players.length; i++) {
			if (thisPlayer == players[i].id) {
				thisPlayerNum = i + 1;
				realPlayerNum = thisPlayerNum;
			}
			if (thisPlayerNum%2 == 0) {
				var textBox = document.getElementById('textBox');
				textBox.placeholder = "";
			}

			$('#participants').append('<span id="' + players[i].id + '">' +
			players[i].name + ' ' + (players[i].id === sessionId ? '(You)' : '') + '<br /></span>');
		} 
		
		// Target is the image number of the other player in this game
		if (thisPlayerNum%2 == 0 && target == 0) {
			target = thisPlayerNum - 1;
			realTarget = target;
		}
		else if (thisPlayerNum%2 != 0 && target == 0) {
			target = thisPlayerNum + 1;
			realTarget = target;
		}		
	}

	// Updates imageArray, the image arrays for both players, and locationArray
	function updateImageArray(imageArrayInput) {
		$('#imageArray').html(''); 

		imageArrayInput = $.grep(imageArrayInput,function(n){ return(n) });

		for (var i = 0; i < imageArrayInput.length; i++) {
			imageArray[i] = imageArrayInput[i].replace("\r","");
			imageArrayP1[i] = "ImagesP1/" + imageArray[i].split(",")[0];		
			imageArrayP2[i] = "ImagesP2/" + imageArray[i].split("_")[0] + ".jpg";	
			expressionOutput[i] = imageArray[i].split(",")[0];

			var objectLocation = new Array(4);
			for (var j = 0; j < 4; j++) {
				objectLocation[j] = imageArray[i].split(",")[j+1];
			}
			locationArray[i] = objectLocation;
			
			randomNumbers[i] = i;
		}	
		randomNumbers[0] = '';
		shuffle(randomNumbers);
	}

	// New connection events
	socket.on('connect', function () {
		sessionId = socket.socket.sessionid;
		thisPlayer = sessionId;
		console.log('Connected ' + sessionId);
		socket.emit('newUser', {id: sessionId, name: $('#name').val()});
	});

	// Update participants and initialize game
	socket.on('newConnection', function (data) {    
		updateParticipants(data.participants);
		// Notify the first player who connected that another player has joined
		if (realPlayerNum%2 != 0 && data.participants.length == realPlayerNum + 1) {
			alert("A new player has joined!  Press the Start button to begin.");
			
			var text = document.getElementById('directions');    
			text.innerHTML = 	'Enter a description referring to the object bounded by the red box so that the other player will be able to distinguish this object from other similar objects in the image.';
			
			var expression = document.getElementById('expression');    
			expression.innerHTML = '';
			
			// Show start button for player 1 to start the game
			var submitButton = document.getElementById('submitButton');    
			submitButton.style.visibility = 'visible';
			submitButton.value = "Start!";
		}
		// Set up the display for the second player to connect
		if (realPlayerNum %2 == 0 && data.participants.length == realPlayerNum) {
			var text = document.getElementById('directions');    
			text.innerHTML = 	"Click on the object in the image described by the other player.";
			var expressionText = document.getElementById("expression");   
			expressionText.innerHTML = "Waiting for other player...";
			
			var submitButton = document.getElementById('submitButton');    
			submitButton.style.visibility = 'visible';
		}
	});

	// Update the image array for each new player that connects
	socket.on('imageArray', function (data) {    
		if (thisPlayerNum == players.length) {  // TO-DO: I THINK THIS IS BROKEN...  thisPlayerNum and players.length are both 0!  But the game still works...
			updateImageArray(data.imageArray);
		}
	});

	// When a user disconnects, send an email with the data and disconnect the other player
	socket.on('userDisconnected', function(data) {
		if (players[realTarget-1].id == data.id) {
			sendEmail();
			socket.emit('sendEmail', {id: sessionId, name: expressionString});
			socket.disconnect();

			alert("The other player disconnected.  If you wish to continue, refresh the page.");
		}
		
		$('#' + data.id).remove();
	});

	// Parses message to determine what data is being sent.  Also determines who the intended target is.
	socket.on('incomingMessage', function (data) {
		var message = data.message;
		var name = data.name;
		$('#messages').prepend('<b>' + name + '</b><br />' + message + '<hr />');
			
		// Swap the roles of the two players in a game after each correct identification
		if (message == "SWAP" && parseInt(name) == realPlayerNum) {
			swapPlayers();
		}				
		
		// Send image index from player 1 to player 2
		else if (parseInt(name.split(',')[0]) == realPlayerNum && name.split(',')[1] == "imageIndex") {			
			imageIndex = parseInt(message);
			var img = document.getElementById("mainImage");
			img.src = imageArrayP2[imageIndex];
			
			if (imageCount == 0) {
				imageCount = 1;
			}
		}

		else if (message.split(':')[0] == "image") {
			imageArrayP2[message.split(':')[2]] = message.split(':')[1];
		}

		// Draw dot on player 1's screen from player 2's click
		else if (parseInt(name.split(',')[0]) == thisPlayerNum && imageIndex > 0 && thisPlayerNum%2 != 0 && name.split(',')[1] == "click") {
			resetDot();
			drawDot(message.split(",")[0], message.split(",")[1]);
		}

		// Display player 1's referring expression on player 2's screen
		else if (parseInt(name.split(',')[0]) == thisPlayerNum && imageIndex > 0 && thisPlayerNum%2 == 0 && name.split(',')[1] == "expression" && message.split(',')[0] != "Swap") {
			if (typeof timerID !== 'undefined') {
				clearInterval(timerID);
			}
			var text = document.getElementById('expression');    
			text.innerHTML = message;
			timerID = setInterval(countdown, 1000);
		}
		
		// When player 2 submits, display 'Correct' or 'Incorrect' on player 1's screen
		else if (parseInt(name.split(',')[0]) == thisPlayerNum && name.split(',')[1] == "submitClick") {
			dispError(message);    
		}
	});

	// Log an error if unable to connect to server
	socket.on('error', function (reason) {
		console.log('Unable to connect to server', reason);
	});

	// Function for sending messages between clients through the server
	function sendMessage() {
		var outgoingMessage = $('#outgoingMessage').val();
		var name = $('#name').val();
		$.ajax({
		url:  '/message',
		type: 'POST',
		dataType: 'json',
		data: {message: outgoingMessage, name: name}
		});
	}

	$(document).on('ready', loadFile);
}