// USEFUL LINKS: http://stackoverflow.com/questions/21097178/making-tcp-connections-from-meteor-server

/*
 * https://gist.github.com/nachiket-p/2964422
 * 
 * Still trying to get data back from the server to the client:
 * https://forums.meteor.com/t/how-to-send-data-from-server-to-client-without-persisting-to-db/4083/4
 * https://www.eventedmind.com/feed/meteor-meteor-wrapasync
 */

 // test 2
Data = new Mongo.Collection("data");

//////////////////////////////////////////////////////////
// Globals
var client = undefined;  // used for socket connection
var tickTime = 5000;
var tickNum = 0;
var debugCalls = 0;  // counter variable


if (Meteor.isClient) {
	
	chatStream = new Meteor.Stream('chatter');
	
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.hello.helpers({
	counter: function () {
		console.log("template.hello.helpers - get counter");
	  return Session.get('counter');
	},
	data: function() {
		// get all data out of the collection
		var d = Date();
		console.log("template.hello.helpers Data updated at: " + d);
		
		return Data.findOne();
	}   
  });
  
  Template.hello.events({
	  'click .listen': function() {
		  console.log("listen clicked");
	      Meteor.call('listen',function(err, response) {
	    	  console.log("listen command sent");
				
			});		  
	  },
	  'click .connect': function() {
		  console.log("connect clicked");
	      Meteor.call('connect',function(err, response) {
	    	  console.log("connect command sent");
				
			});		  
	  },
	  'click .httprequest': function() {
		  console.log("httprequest clicked");
		  var d = Date();
		  $("#serverresponse").val("Making request at " + d);
		  
		  Meteor.call('httprequest', function(err, response) {
			  console.log("httprequest response: ",response);
			  var d = Date();
			  var output = "Response at " + d + "\nResponse: " + response;
			  console.log("output: " +output);
			  $("#serverresponse").val(output);
		  });
	  },
	  'click .sayhello': function() {
		  console.log("sayhello clicked");
	      Meteor.call('sayhello',function(err, response) {
	    	  console.log("sayhello command sent");
				
			});		  
	  },	
	  'click .disconnect': function() {
		  console.log("disconnect clicked");
	      Meteor.call('disconnect',function(err, response) {
	    	  console.log("disconnect command sent");
			});		  
	  },
	  'click .updateData': function() {
		  console.log("updateData clicked");
	      var data = Data.findOne();
	      
	      console.log("updateData, data=", data);
	      
	      var id = data._id;
	      
	      console.log("updating ID: " + id);
	      
		  var now = new Date();
		  Data.update({_id: id}, {$set: {updatedAt: now}});
	      
	  },	  
	  'click .debug': function() {
		  console.log("debug clicked");
	      Meteor.call('debug',function(err, response) {
	    	  console.log("debug command sent");
	    	  console.log("debug response="+response);
	    	  
	    	  // update the data in the collection based on the server response
	    	  var data = Data.findOne();
	    	  var id = data._id;
	    	  var now = new Date();
	    	  Data.update({_id: id}, {$set: {updatedAt: now, serverResponse: response}});
			});		  
	  },	  
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
      console.log("Counter now " + Session.get('counter'));
      //sendChat("hi");
      // to figure out
      //sayHi();
    },
    'click button .createconn': function () {
        // increment the counter when button is clicked
        Session.set('counter', Session.get('counter') + 1);
        console.log("Counter now " + Session.get('counter'));
        sendChat("hallo");
        // to figure out
        //sayHi();
        Meteor.call('communicate',function(err, response) {
      	  console.log("communication sent");
  			
  		});
      }
  });
  
  
  Template.body.helpers({
	  data: function() {
		  // get all data out of the collection
		  var d = Date();
		  console.log("body Data updated at: " + d);
		  
		  return Data.find({});
	  }
  });
  
  
  /*
  sendChat = function(message) {
    chatStream.emit('message', message);
    console.log('me: ' + message);
  };

  
  chatStream.on('message', function(message) {
    console.log('user: ' + message);
  });
  */
    
}


// start listening for connections on port 7000
function startListening() {
	console.log("startListening()");
	  //to use the net module
	  var net = Npm.require('net');

	  //Creates a new TCP server. The handler argument is automatically set as a listener for the 'connection' event
	  var server = net.createServer(function (socket) {

	    // Every time someone connects, tell them hello and then close the connection.
	    console.log("Connection from " + socket.remoteAddress);
	    socket.end("Hello World\n");
	  });

	  //Fire up the server bound to port 7000 on localhost
	  server.listen(7000, "localhost");

	  // Put a friendly message on the terminal
	  console.log("TCP server listening on port 7000 at localhost.");
}

function sayHello() {
	console.log("sayHello()");
	if (client == undefined) {
		console.log("Not connected.  Connect first.");
	} else {
		client.write('hello world!\r\n');	
	}
}

function disconnect() {
	console.log("disconnect()");
	if (client == undefined) {
		console.log("Not connected.");
	} else {
		//console.log("client=",client);
		console.log("connected to: " + client.remoteAddress);
		client.end();	
		
		// not sure if this is going to create a memory leak or not
		client = undefined;
	}
}

// connect to a remote server
function connectToServer() {
	console.log("connectToServer()");
	var net = Npm.require('net');
	
	if (client != undefined) {
		console.log("Already connected");
		return;
	}
	
	// set global variable
	client = net.connect({port: 7000, host: "localhost"},
	    function() { //'connect' listener
			console.log('connected to server!');
			//client.write('hello world!\r\n');
			//client.write('startstream\r\n');
			client.write('startstream\n');
	});

	// an error occurred
	client.on('error',function(err){
	   console.log('an error occurred:'+err);
	});
	
	// an error occurred
	client.on('uncaughtException',function(err){
	   console.log('something terrible happened..');
	});


	// Got some data
	client.on('data', Meteor.bindEnvironment(function(data) {
	  console.log("got data");
	  console.log(data.toString());
	  
	  //client.end();

	  var d = new Date();
	  var data = Data.findOne();
	  
	  var id = data._id;
	  Data.update({_id: id}, { $set: { value: d }});
	}));
	
	client.on('end', function() {
	  console.log('disconnected from server');
	  // I'm not sure if this is going to create a memory leak or not
	  client = undefined;
	});
}


function makeHttpRequest(hostname, path, method, payload) {
	console.log("makeHttpRequest");
	
	var http = Npm.require('http');
	var net = Npm.require('net');
	var querystring = Npm.require('querystring');
	
	//var url="http://localhost/phpDev/callbackHandler/callbackHandler.php";
	//var hostname = "localhost";
	//var path = "/phpDev/callbackHandler/callbackHandler.php?param1=foo";
	//var postData = {"source": "AMTD"};
	
	//var postData = querystring.stringify({
	//	  'msg' : 'Hello World!'
	//});
	
	var postData = querystring.stringify(payload);
	
	console.log("postData.length=",postData.length);
	console.log("postData=",postData);
	
	if (method == "GET") {
		console.log("Sending GET - append payload to URI");
		
		if(path.indexOf("?") > -1) {
			console.log("path already has a parameter");
			path = path + "&" + postData;
		}
		else
		{
			console.log("path has no parameters yet");
			path = path + "?" + postData;
		}
	}
	
	console.log("path="+path);
	
	var options = {
			  hostname: hostname,
			  port: 80,
			  path: path,
			  method: method,
			  headers: {
			    'Content-Type': 'application/x-www-form-urlencoded',
			    'Content-Length': postData.length
			  }
	};
	
	var req = http.request(options, function(res) {
		  console.log('STATUS: ' + res.statusCode);
		  console.log('HEADERS: ' + JSON.stringify(res.headers));
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
		    console.log('BODY: ' + chunk);
		  });
		  res.on('end', function() {
		    console.log('No more data in response.')
		  })
	});
	
	req.on('error', function(e) {
		  console.log('problem with request: ' + e.message);
		});

	// write data to request body
	req.write(postData);
	req.end();
	
	return "OK";
}

function debug() {
	console.log("debug()");
	
	debugCalls++;
	
	var response = "["+debugCalls+"] DEBUGGING";
	return response;
}


function timerTick()
{
	var d = new Date();
	console.log("["+tickNum+"] Tick..." + d);

	//var count = Data.find({}).count();
	//console.log("Number of data records: " + count);
	//
	var data = Data.findOne();
	//
	//var id = data._id;
	//Data.update({_id: id}, { $set: { value: d, text:"blah" }});
	//
	//var data = Data.findOne();
	console.log("Data is currently: ", data);

	tickNum++;
	
	// continously update
	Meteor.setTimeout(timerTick, tickTime);
}

if (Meteor.isServer) {
	var count = Data.find({}).count();
	console.log("Number of data records: " + count);
	
	if (count == 0) {
		// create a first record
		Data.insert({value: "junk"});
	}
  
  
  /*
  chatStream = new Meteor.Stream('chatter');
  
  chatStream.permissions.write(function(eventName) {
	    return true;
	  });

  chatStream.permissions.read(function(eventName) {
	    return true;
	  });
	  
	  */
  
	
  Meteor.methods({
	  listen: function() {
		  console.log("method listen");
		  startListening();
	  },
	  connect: function() {
		  console.log("method connect");
		  connectToServer();
	  },
	  httprequest: function() {
		  console.log("method httprequest");
		  var hostname = "localhost";
		  var path = "/phpDev/callbackHandler/callbackHandler.php?param1=foo";
		  var method = "GET";
		  var appid = "appid123";
		  var source = "AZDF";
		  var payload = { var1: "value1", 
				  var2: "value2", 
				  var3: "make?it a space",
				  "!U" : "abc123",
				  "A=userid" : "123%%black",
				  "T" : "0+1+2+3",
				  "appid" : "appid123|source=" + source
			};
		  
		  return makeHttpRequest(hostname,
				  path,
				  method,
				  payload);
	  },
	  sayhello: function() {
		  console.log("method sayhello");
		  sayHello();
	  },
	  disconnect: function() {
		  console.log("method disconnect");
		  disconnect();
	  },
	  debug: function() {
		  console.log("method debug");
		  return debug();
	  }	  
  });
  
  /*
  chatStream.emit('message', 'server generated event');

  chatStream.on('message', function(message) {
    console.log('server side: ' + message);
  });
  */ 
  //startListening();
  Meteor.startup(function () {
	    // code to run on server at startup
		  //Meteor.setTimeout(timerTick, tickTime);
  });
	  
  
}
