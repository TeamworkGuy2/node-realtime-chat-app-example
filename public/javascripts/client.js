$(document).ready(function onLoad() {
  var socketPort = 53000;
  var path = window.location.protocol + "//" + window.location.hostname + ":" + socketPort;
  var socket = io(path);
  var msgListElem = $('#messages');
  var user = { nickname: null };

  // Check if nickname stored in localStorage
  if('localStorage' in window && localStorage.getItem('nickname')) {
    user.nickname = localStorage.getItem('nickname');
  }
  else {
    user.nickname = promptAndSaveNickname();
  }

  setNickname(user.nickname);
  setupNicknameChangeListener(socket, user, msgListElem);

  // Send message to server that user has joined
  socket.emit('join', {
    nickname: user.nickname,
    when: Date.now()
  });

  // Handle the form to submit a new message
  $('form').submit(function submitForm(e) {
    e.preventDefault();

    var msgField = $('#msg');
    var msgVal = msgField.val();
    if(msgVal.trim().length === 0) { return; }

    var data = {
      msg: msgVal,
      nickname: user.nickname,
      when: Date.now()
    };

    // Send message to Socket.io server
    socket.emit('msg', data);
    // Add message to the page
    addMessage(data, msgListElem);
    // Clear the message field
    msgField.val('');    
  });

  var alsoAdd = [];

  // When a message is received from the server add it to the page
  socket.on('msg', function (data) {
    if(firstMsg) {
      alsoAdd.push(data);
      queryForMissingMsgs(socket, data, alsoAdd, msgListElem);
    }
    else {
      addMessage(data, msgListElem);
    }
  });

  // When a notice is received from the server (user renamed, joins, or leaves), add it to the page
  socket.on('notice', function (data) {
    if(firstMsg) {
      alsoAdd.push(data);
      queryForMissingMsgs(socket, data, alsoAdd, msgListElem);
    }
    else {
      addNotice(data, msgListElem);
    }
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


var firstMsg = true;

function queryForMissingMsgs(socket, latestPost, alsoAdd, dstList) {
  if(!firstMsg) { return; }

  var min = getLastMsgTimestampFromUi(dstList);
  var max = latestPost.when;
  socket.emit("query", { minTimestamp: min, maxTimestamp: max, when: Date.now() });

  socket.on("query", function (posts) {
    if(!firstMsg) { return; }

    firstMsg = false;
    addPosts(posts, dstList);
    addPosts(alsoAdd, dstList);
  });
}


function addPosts(posts, dstList) {
  for(var i = 0, size = posts.length; i < size; i++) {
    var post = posts[i];
    if(post.isPost) {
      addMessage(post, dstList);
    }
    else {
      addNotice(post, dstList);
    }
  }
}


function getLastMsgTimestampFromUi(msgList) {
  var lastMsg = msgList.find("li, div")[0];
  return lastMsg ? parseInt(lastMsg.dataset.postDate) : null;
}


function setNickname(nameStr) {
  $('.user-name').text("user: " + nameStr);
}


function setupNicknameChangeListener(socket, user, dstList) {
  $('a.user-name').on("click", function () {
    var newName = promptAndSaveNickname(user.nickname);
    var oldName = user.nickname;
    if(newName !== user.nickname) {
      socket.emit("rename", {
        oldName: oldName,
        newName: newName,
        when: Date.now()
      });

      setNickname(newName);
      user.nickname = newName;
      addNotice({ msg: oldName + " has renamed themself " + newName }, dstList);
    }
  });
}


// Function to add a notice (user renamed, joins, or leaves) to the page
function addNotice(data, dstList) {
    var now = Date.now();
    var notice = $('<div class="notice">').text(data.msg);
    notice[0].dataset.postDate = now;

    dstList.prepend(notice);
}


// Function to add a message to the page
function addMessage(data, dstList) {
  var now = Date.now();
  var who = $('<div class="who">').text(data.nickname);
  var when = $('<div class="when">').text(new Date(now).toString().substr(0, 24));
  var msg = $('<div class="msg">').text(data.msg);
  var header = $('<div class="header clearfix">').append(who).append(when);
  var li = $('<li>').append(header).append(msg);
  li[0].dataset.postDate = now;

  dstList.prepend(li);
}
