## Image Game

This is a two-player online game for gathering referring expressions for objects in images. It uses socket.io and is built on Node.js.

## Installation

First, install Node.js.  To install all of the node packages, go to the directory of the game in Command Prompt and run: ```npm install```

To start the game server, run: ```node server.js```

## Testing Locally

The game can be tested locally using a local web server such as xampp.  Copy the ```game-code``` folder into your ```/xampp/htdocs/``` directory.  Start up the local server by starting Apache and MySQL in xampp-control, and run ```node server.js``` in Command Prompt at the ```/xampp/htdocs/game-code``` directory.  In your web browser, navigate to ```localhost:9000``` to view the game.  

## Deploying Online

The game can easily be uploaded onto the internet for anyone to play using a service such as nodejitsu.  Nodejitsu can be installed locally by running ```npm install jitsu -g```  The game can be deployed using ```jitsu deploy```

## Creating an Image Dataset

The dataset used in this game was created in Matlab from LabelMe images.  The Matlab code also generates the text document ```inputFileNew.txt```, which the game uses to load images and object locations.  If you wish to create your own dataset or add more images to the current dataset, the Matlab code is included in this repository.  However, it requires some setting up, and in order for it to work, it is necessary for your image filenames and annotation files to follow a specific format.  If you need any assistance, please contact me.  In addition, I am happy to set up an image dataset for anyone who wants to create their own.  If you want me to do this for you, please send me a folder with the images and the corresponding LabelMe annotation files, and I can create the dataset and the text file for you.
