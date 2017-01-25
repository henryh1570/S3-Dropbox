// Instantiate depedencies.
var fs = require('fs')              // FileSystem for reading files.
var AWS = require('aws-sdk');       // Amazon SDK
var s3 = new AWS.S3();              // Amazon's S3 SDK

var myBucket = 'hdropbox';          // Unique Bucket name to use.
var myKey = 'myFile.txt';           // New name for the file.
var file = './test.txt';            // Path of file to send.
var dirName = './localbox';         // Directory to monitor
var chokidar = require('chokidar'); // FileSystem watcher

var http = require('http');         // Used for Setting HTTP Server
var express = require('express');   // ExpressJS object
var app = express();                // ExpressJS object
var path = require("path");         // Used for Setting HTTP Server

var watcher = chokidar.watch('file, dir, or glob', {
  ignored: /[\/\\]\./, persistent: true
});

// CORS on ExpressJS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var fullPath = './'; // Used for S3 commands.

var log = console.log.bind(console);

// Function of uploading the file to the bucket.
function uploadFileToS3(filePath) {
	fs.readFile(filePath, function (err, data) {
		params = {Bucket: myBucket, Key: myKey, Body: data, ACL: "public-read"};
	    s3.putObject(params, function(err, data) {
	         if (err) {
	             console.log(err)
	         } else {
	             console.log("Successfully uploaded data to " + myBucket, data);
	         }
	    });
	});
}

// Function of deleting the file on the bucket.
function deleteFileOnS3() {
		params = {Bucket: myBucket, Key: myKey};
	    s3.deleteObject(params, function(err, data) {
	         if (err) {
	             console.log(err)
	         } else {
	             console.log("Successfully deleted data in " + myBucket, data);
	         }
	    });
}

// The type of things to monitor here.
watcher
  .on('add', function(path) { log('File', path, 'has been added'); })
  .on('change', function(path) {log('File', path, 'has been changed'); })
  .on('unlink', function(path) { log('File', path, 'has been removed'); })
  .on('ready', function() {log('Initial scan complete. Ready for changes. '); })

// Watch on the specified file path.
require('chokidar').watch(dirName, {ignored: /[\/\\]\./}).on('all', function(event, path) {

    fullPath = './'.concat(path);
    myKey = path.substring('localbox/'.length);

    if (event == 'add') {

        console.log('Adding: ', path);
        uploadFileToS3(fullPath);
    } else if (event == 'change') {

        console.log('Change: ', path);
        uploadFileToS3(fullPath);
    } else if (event == 'unlink') {

        console.log('Unlink: ', path);
        deleteFileOnS3();
    } else {

        console.log('Ready: ', path);        
    }
});

// This section hosts the HTTP API as a webservice.

app.listen = function() {
    var server = http.createServer(this);
    return server.listen.apply(server,arguments);
};

app.get('/', function (req, res) {
    res.redirect('../list')
})

app.get('/list', function(req, res){
	var params = {
	  Bucket: myBucket	  
	};
	s3.listObjects(params, 	function(err, data){	  
	  for(var i = 0; i < data.Contents.length; i++) {
	  	data.Contents[i].Url = 'https://s3-us-west-1.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;
	  }	  
	  res.send(data.Contents);
	})
})

app.get('/test', function (req, res) {
    res.send('Healthy!');
})

app.get('*', function(req, res) {
    res.redirect('../list')
});

console.log('JS is listening');
app.listen(3000);



