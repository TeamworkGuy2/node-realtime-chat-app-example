// Startup Express App
var express = require('express');
var http = require('http');
var path = require('path');
var socketIo = require('socket.io');
var db = require('./in-mem-db');

var httpServer = http.Server(app);
var io = socketIo(httpServer);
var app = express();
var webPort = 3000;
var socketPort = 53000;
httpServer.listen(process.env.PORT || socketPort);


// Connect to DB
var dbConn;
var dbColl_Messages;

function createDb() {
  dbConn = db.newInMemDb({
    name: "hds-devcon-chat-app",
    collectionConfigs: [{
      name: "messages",
      maxSize: 100
    }]
  });

  dbColl_Messages = dbConn.getCollection("messages");
}

createDb();


// Configure Jade template engine
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "jade");
app.use(express.static(path.join(__dirname + "/../", "public")));
app.use("/socket.io", express.static(path.join(__dirname, "../node_modules/socket.io-client/")));

// handle HTTP GET request to the "/" URL
app.get("/", function(req, res) {

  console.log("requesting - " + req.method + " " + req.url);

  // Get the 100 most recent messages from the DB
  var items = dbColl_Messages.getItems().sort(function (a, b) {
    return a.when < b.when ? 1 : a.when > b.when ? -1: 0;
  });

  // Pass the message list to the view
  res.render("index", { messages: items });    
});

app.listen(webPort, function () {
  console.log("starting chat app on port " + webPort);
});


// socket.io listen for messages
io.on("connection", function(socket) {
  // When a message is received, broadcast it 
  // to all users except the originating client
  socket.on('msg', function(data) {

    // TODO debugging
    console.log("message: ", data);

    dbColl_Messages.addItem(data);
    socket.broadcast.emit('msg', data);        
  });

  // When a user joins the chat, send a notice
  // to all users except the originating client
  socket.on('join', function(nickname) {

    // TODO debugging
    console.log("join: ", nickname);

    // Attach the user's nickname to the socket
    socket.nickname = nickname;
    socket.broadcast.emit('notice', nickname + ' has joined the chat.');
  });

  // When a user renames themself, send a notice
  // to all users except the originating client
  socket.on('rename', function(oldName, newName) {

    // TODO debugging
    console.log("rename: ", oldName, "to", newName);

    // Attach the user's nickname to the socket
    socket.nickname = newName;
    socket.broadcast.emit('notice', oldName + ' has renamed themself ' + newName);
  });

  // When a user disconnects, send a notice
  // to all users except the originating client
  socket.on('disconnect', function() {

    // TODO debugging
    console.log("leave: ", socket.nickname);

    socket.broadcast.emit('notice', socket.nickname + ' has left the chat.');
  });
});