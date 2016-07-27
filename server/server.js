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
var msgsCollection;

function createDb() {
  dbConn = db.newInMemDb({
    name: "hds-devcon-chat-app",
    collectionConfigs: [{
      name: "messages",
      maxSize: 100
    }]
  });

  msgsCollection = dbConn.getCollection("messages");
}

createDb();

function getSortedItems() {
  return msgsCollection.getItems().sort(function (a, b) {
    return a.when < b.when ? 1 : a.when > b.when ? -1: 0;
  });
}

function copyCollection(items) {
  return JSON.parse(JSON.stringify(items));
}


// Configure Jade template engine
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "jade");
app.use(express.static(path.join(__dirname + "/../", "public")));
app.use("/socket.io", express.static(path.join(__dirname, "../node_modules/socket.io-client/")));

// handle HTTP GET request to the "/" URL
app.get("/", function (req, res) {

  console.log("requesting: " + req.method + " " + req.url);

  // Get the 100 most recent messages from the DB
  var items = copyCollection(getSortedItems());
  items.forEach(function (i) { i.isPost = i.action == "user-posted-message"; });

  // Pass the message list to the view
  res.render("index", { messages: items });    
});

app.listen(webPort, function () {
  console.log("starting chat app on port " + webPort);
});


var users = [];

// socket.io connection to listen for messages
ioSocket.on("connection", function (socket) {

  // When a message is received, broadcast it 
  // to all users except the originating client
  socket.on("msg", function (msgData) {
    console.log("message: ", msgData);

    msgData.action = "user-posted-message";
    msgData.isPost = true;
    msgsCollection.addItem(msgData);

    socket.broadcast.emit("msg", msgData);
  });


  // When a user joins the chat, send a notice
  // to all users except the originating client
  socket.on("join", function (joinData) {
    var nickname = joinData.nickname;
    users.push(socket);

    console.log("join: ", nickname, "(" + users.length + " users)");

    joinData.action = "user-connected";
    joinData.msg = nickname + " has joined the chat.";
    msgsCollection.addItem(joinData);
    // Attach the user's nickname to the socket
    socket.nickname = nickname;
    socket.broadcast.emit("notice", joinData);
    socket.emit("notice", joinData);
  });


  // When a user renames themself, send a notice
  // to all users except the originating client
  socket.on("rename", function (renameData) {
    var oldName = renameData.oldName;
    var newName = renameData.newName;

    console.log("rename: ", oldName, "to", newName);

    renameData.action = "user-renamed";
    renameData.msg = oldName + " has renamed themself " + newName;
    msgsCollection.addItem(renameData);
    // Attach the user's nickname to the socket
    socket.nickname = newName;
    socket.broadcast.emit("notice", renameData);
  });


  // 'query' expects an object with min and/or max timestamps and sends back
  // an array of messages which have a timestamp falling within that range
  socket.on("query", function (queryData) {
    var min  = queryData.minTimestamp || Number.MIN_SAFE_INTEGER;
    var max  = queryData.maxTimestamp || Number.MAX_SAFE_INTEGER;

    var items = getSortedItems();
    var res = [];

    for(var i = 0, size = items.length; i < size; i++) {
      var item = items[i];
      if(min < item.when && max > item.when) {
        res.push(item);
      }
    }

    console.log("query min: " + min + ", max: " + max + ", " + res.length + " matches of " + items.length);

    socket.emit("query", res);
  });


  // When a user disconnects, send a notice
  // to all users except the originating client
  socket.on("disconnect", function () {
    remove(users, socket);

    console.log("leave: ", socket.nickname, "(" + users.length + " users)");

    var leaveData = {
      action: "user-disconnect",
      msg: socket.nickname + " has left the chat.",
      nickname: socket.nickname,
      when: Date.now()
    };
    msgsCollection.addItem(leaveData);

    socket.broadcast.emit("notice", leaveData);
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
