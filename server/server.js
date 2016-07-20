var fs = require("fs");
var express = require("express");
var http = require("http");
var path = require("path");
var socketIo = require("socket.io");
var db = require("./in-mem-db");

var webPort = 3000;
var socketPort = 53000;
var httpServer = http.Server(app);
var ioSocket = socketIo(httpServer);
var app = express();

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
app.get("/", function (req, res) {

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


var users = [];

// socket.io listen for messages
ioSocket.on("connection", function (socket) {

  // When a message is received, broadcast it 
  // to all users except the originating client
  socket.on("msg", function (data) {
    console.log("message: ", data);

    dbColl_Messages.addItem(data);
    socket.broadcast.emit("msg", data);
  });

  // When a user joins the chat, send a notice
  // to all users except the originating client
  socket.on("join", function (nickname) {
    users.push(socket);

    console.log("join: ", nickname, "(" + users.length + " users)");

    // Attach the user's nickname to the socket
    socket.nickname = nickname;
    socket.broadcast.emit("notice", nickname + " has joined the chat.");
  });

  // When a user renames themself, send a notice
  // to all users except the originating client
  socket.on("rename", function (oldName, newName) {
    console.log("rename: ", oldName, "to", newName);

    // Attach the user's nickname to the socket
    socket.nickname = newName;
    socket.broadcast.emit("notice", oldName + " has renamed themself " + newName);
  });

  // When a user disconnects, send a notice
  // to all users except the originating client
  socket.on("disconnect", function () {
    remove(users, socket);

    console.log("leave: ", socket.nickname, "(" + users.length + " users)");

    socket.broadcast.emit("notice", socket.nickname + " has left the chat.");
  });
});


// ==== utils ====

/** remove the first matching element from an array */
function remove(ary, val) {
    for (var i = 0, size = ary.length; i < size; i++) {
        if (ary[i] === val) {
            ary[i] = ary[size - 1];
            ary.pop();
            return true;
        }
    }
    return false;
}

/** emit a message to all listening sockets */
function emitToAll(type, data) {
    var clients = ioSocket.sockets.sockets;
    for (var i = 0, size = clients.length; i < size; i++) {
        clients[i].emit(type, data);
    }
}

/** run a task at a random time between now and maxIntervalMs and then wait for the task to return before setting up another timer to run it again and again... */
function setupAwaitTaskTimer(maxIntervalMs, task) {
    setTimeout(function () {
        var c = 0;
        task(function () {
            c++;
            if (c === 1) {
                setupAwaitTaskTimer(maxIntervalMs, task);
            }
        });
    }, Math.random() * maxIntervalMs);
}
