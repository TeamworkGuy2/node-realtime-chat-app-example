$(document).ready(function onLoad() {
  var socketPort = 53000;
  var path = window.location.protocol + "//" + window.location.hostname + ":" + socketPort;
  var socket = io(path);
  var msgList = $('#messages');
  var user = { nickname: null };

  // Check if nickname stored in localStorage
  if('localStorage' in window && localStorage.getItem('nickname')) {
    user.nickname = localStorage.getItem('nickname');
  }
  else {
    user.nickname = promptAndSaveNickname();
  }

  setNickname(user.nickname);
  setupNicknameChangeListener(socket, user);

  // Send message to server that user has joined
  socket.emit('join', user.nickname);

  // Handle the form to submit a new message
  $('form').submit(function submitForm(e) {
    e.preventDefault();

    var msgField = $('#msg');
    var msgVal = msgField.val();
    if(msgVal.trim().length === 0) { return; }

    var data = {
      msg: msgVal,
      nickname: user.nickname,
      when: new Date()
    };

    // Send message to Socket.io server
    socket.emit('msg', data);
    // Add message to the page
    addNewMessage(data, msgList);
    // Clear the message field
    msgField.val('');    
  });  

  // When a message is received from the server add it to the page
  socket.on('msg', function (data) {
    addNewMessage(data, msgList);
  });

  // When a notice is received from the server
  // (user joins or disconnects), add it to the page
  socket.on('notice', function (msg) {
    msgList.prepend($('<div class="notice">').text(msg));
  });
});


function promptAndSaveNickname(existingName) {
  // If not in localStorage, prompt user for nickname
  var nickname = prompt('Please enter your nickname', existingName);
  if('localStorage' in window) {
    localStorage.setItem('nickname', nickname);
  }
  return nickname;
}

function setNickname(nameStr) {
  $('.user-name').text("user: " + nameStr);
}

function setupNicknameChangeListener(socket, user) {
  $('a.user-name').on("click", function () {
    var newName = promptAndSaveNickname(user.nickname);
    if(newName !== user.nickname) {
      socket.emit("rename", user.nickname, newName);
      setNickname(newName);
      user.nickname = newName;
    }
  });
}

// Function to add a message to the page
function addNewMessage(data, dstList) {
  var who = $('<div class="who">').text(data.nickname),
      when = $('<div class="when">').text(new Date().toString().substr(0, 24)),
      msg = $('<div class="msg">').text(data.msg),
      header = $('<div class="header clearfix">').append(who).append(when),
      li = $('<li>').append(header).append(msg);    

  dstList.prepend(li);
}
