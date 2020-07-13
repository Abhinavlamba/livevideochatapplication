var pc;
$(document).ready(function () {
  var socket = io.connect();
  var $chatWrap = $('#chatWrap');
  var $loginWrap = $('#loginWrap');
  var $loginForm = $('#loginForm');
  var $chatForm = $('#chatBox');
  var $msg = $('#message');
  var $username = $('#email');
  var $password = $('#password');
  var $chatScoll = $('#chatScroll').find('ul');
  var $name = $('#personName');
  var $image = $('#personImage');
  var $profile = $('#profile4');
  var $cross = $('#cross');
  var $list = $("#list");
  var $listWrap = $("#listWrap");
  var self;
  // var friend = [];
  // var buissnes = [];
  // var relative = [];
  var relations = [];
  var listfriend = [];
  var listbuissness = [];
  var listrelatives = [];
  var onlineusers = [];
  var users = [];
  var usertype = "buissness";
  $loginForm.on('submit', function (e) {
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/users/login",

      data: {
        email: $username.val(),
        password: $password.val()
      },
      success: function (result, status, xhr) {
        console.log("Status", status, xhr);
        // console.log(result);
        var json = JSON.parse(result);
        for (var i = 0; i < json.relations.length; i++) {
          relations.push(json.relations[i]);
        }
        console.log(relations);
        for (var i = 0; i < json.users.length; i++) {
          users.push(json.users[i]);
        }
        $newUser = $username.val();
        self = $newUser;
        console.log('want to connect as ' + $newUser);
        if ($newUser != '') {
          $(this).disabled = true;
          // console.log('here1');
          socket.emit('new user', $newUser, function (data) {
            // location.href = "/";
            if (data) {
              // console.log(data)
              $chatWrap.slideDown();
              $loginWrap.slideUp();
              $listWrap.slideUp();
              // $('#title').html('ChatApp v0.0.2 - Welcome, ' + $newUser);
              $username.val('');
              // localStream.href = '/users/temp';
            } else {
              alert("You are already logged in from another device.")
            }
          });
        } else {
          $('#loginMsg').html('Please enter a valid username to connect.');
          $(this).disabled = false;
        }
        // location.href = "https://simple-videochat.herokuapp.com/"
        // location.reload();
      },
      error: function (result) {
        alert('Incorrect Details');
      }
    });
  });
  $("#updateform").on('submit', function (e) {
    e.preventDefault();
    var user = users.filter(e => e.email === self)[0];
    console.log(user);
    var formData = new FormData(this);
    $.ajax({
      type: "POST",
      url: "/users/update",
      data: formData,
      processData: false,
      contentType: false,
      success: function (result) {
        socket.emit('update user', function () {
          console.log('update user');
          location.href = '/';
        })
      },
      error: function (e) {
        alert('This user already exists.');
      }
    })
  })
  socket.on('user', function (data) {
    console.log(data);
    data = JSON.parse(data);
    users = [];
    for (var i = 0; i < data.users.length; i++) {
      users.push(data.users[i]);
    }
  })
  socket.on('users', function (data) {
    // console.log(data);
    listfriend = [];
    listbuissness = [];
    listrelatives = [];
    onlineusers = [];
    var listHtml = '';
    var image;
    $('#userList').html('');
    // ($name).html('');
    // $('#userList').append('<br/>').append('<br/>');
    function handler() { alert('Jai Mata Di'); }
    for (i = 0; i < data.length; i++) {
      // console.log(data[i])
      var json = { email: data[i] };
      onlineusers.push(json);
      var result = data[i];
      result = users.filter(function (e) {
        return e.email === data[i]
      })[0]
      // console.log(result);
      var email = result.email;
      var name = result.name;
      // console.log(name);
      var profile = result.image;
      if (self == email) {
        // self = data[i];
        image = profile;
        var name4 = name;
        name4 = name4.replace(/-/g, ' ');
        $("#username").text(name4);
        $("#useremail").text(email);
        $("#userimage").attr('src', '/' + profile);
      }
      var userCard = $('<button class = "pickup-button" > Video Call </button>').attr('id', data[i]);

      // $('#userList').append('<div id = "food-table">');
      // $('#userList').append(userCard);
      // $('#userList').append('<ul>');
      // $('#userList').append('<li>');
      // $('#userList').append("Name : " + data[i]);
      // $('#userList').append('</li>');
      // $('#userList').append('</ul>');
      // $('#userList').append('</div>');
      var name2 = name;
      // console.log(name);
      name2 = name2.replace(/-/g, ' ');
      $('#userList').append('<div id="food-table" class = "row"><div><img id = "userprofile" src = "./' + profile + '" class = "user image2"> </div><div class = "column1">       ' + name2 + '</div> <div class = "column">  ' + email + '</div><div class = "column"><button class="pickup-button" id = "' + data[i] + '"> Video Call </button></div></div>');
      // $('#userList').append('<div id = "food-table"><button class = "pickup-button">cancel </button> </div>');

      var user1, user2;
      user1 = users.filter(e => e.email === self)[0];
      user2 = users.filter(e => e.email === data[i])[0];
      for (var j = 0; j < relations.length; j++) {
        // console.log(relations[j]);
        // console.log(user1);
        // console.log(user2);
        if (relations[j].user_id1 == user1.id && relations[j].user_id2 == user2.id) {
          if (relations[j].type == 0)
            listfriend.push(user2);
          else if (relations[j].type == 1)
            listbuissness.push(user2);
          else
            listrelatives.push(user2);
        }
      }
    }
    console.log('b');
    console.log(listbuissness);
    console.log('f');
    console.log(listfriend);
    console.log('r');
    console.log(listrelatives);

  });
  socket.on('update relations', function (data) {
    relations = [];
    data = JSON.parse(data);
    for (var i = 0; i < data.relations.length; i++) {
      relations.push(data.relations[i]);
    }
  })
  socket.on('message', function (data) {
    $('#chatScroll>ul').prepend('<li><b>' + data.name + ': </b>' + data.msg + '</li>');
  });
  $("#list").on('click', function (e) {
    // e.preventDefault();
    $("#buissnesslist").click();
    $listWrap.slideDown();
    $("#cover").fadeIn();
  });
  $("#listclose").on('click', function (e) {
    // $chatWrap.slideDown();
    $listWrap.slideUp();
    $("#cover").fadeOut();
  })
  $(document).on('click', "#listWrap #food-table .clicklist", function (e) {
    e.preventDefault();
    console.log('click');
    var data;
    var select = $(this).attr('id');
    if (select == 'friendslist') {
      data = listfriend;
      usertype = 'friend';
      $("#buissnessline").hide();
      $("#relativeline").hide();
      $("#friendline").show();
    } else if (select == 'buissnesslist') {
      data = listbuissness;
      usertype = 'buissness';
      $("#buissnessline").show();
      $("#relativeline").hide();
      $("#friendline").hide();
    } else {
      data = listrelatives;
      usertype = 'relative';
      $("#buissnessline").hide();
      $("#relativeline").show();
      $("#friendline").hide();
    }
    $("#contacts").html("");
    for (i = 0; i < data.length; i++) {
      // console.log(data[i])
      var online = onlineusers.filter(e => e.email === data[i].email);
      console.log(online);
      if (online.length == 0)
        continue;
      var result = data[i];
      var email = result.email;
      var name = result.name;
      var profile = result.image;
      if (self == email) {
        // self = data[i];
        image = profile;
        var name4 = name;
        name4 = name4.replace(/-/g, ' ');
        $("#username").text(name4);
        $("#useremail").text(email);
        $("#userimage").attr('src', '/' + profile);
      }
      var userCard = $('<button class = "pickup-button" > Video Call </button>').attr('id', data[i]);

      // $('#userList').append('<div id = "food-table">');
      // $('#userList').append(userCard);
      // $('#userList').append('<ul>');
      // $('#userList').append('<li>');
      // $('#userList').append("Name : " + data[i]);
      // $('#userList').append('</li>');
      // $('#userList').append('</ul>');
      // $('#userList').append('</div>');
      var name2 = name;
      name2 = name2.replace(/-/g, ' ');
      $('#contacts').append('<div id="food-table" class = "row"><div><img id = "userprofile" src = "./' + profile + '" class = "user image2"> </div><div class = "column1">       ' + name2 + '</div> <div class = "column">  ' + email + '</div><div class = "column"><button class="pickup-button" id = "' + data[i].email + '"> Video Call </button><div class="topcorner2"><img src = "../cross.png" class = "crossuser" id = "' + email + '$#' + '" style="height: 8px;width: 8px; -webkit-filter: invert(100%); filter: invert(100%);"></div></div></div>');
      // $('#userList').append('<div id = "food-table"><button class = "pickup-button">cancel </button> </div>');
    }
  })

  $(document).on('click', '#listWrap #contacts .crossuser', function (e) {
    // e.preventDefault();
    console.log('click');
    var id2 = $(this).attr('id');
    // console.log(id2);
    var friend_id = id2.split('$')[0];
    console.log(friend_id);
    var user1 = users.filter(e => e.email === self)[0];
    var user2 = users.filter(e => e.email === friend_id)[0];
    var id = user2.id;
    // console.log(id + ' ' + usertype);
    $.ajax({
      type: "POST",
      url: "/users/remove",
      data: {
        user_id1: user1.id,
        user_id2: user2.id,
        type: usertype
      },
      success: function (result) {
        console.log(result)
        result = JSON.parse(result);
        relations = [];
        for (var i = 0; i < result.relations.length; i++) {
          relations.push(result.relations[i]);
        }
        if (usertype == 'friend') {
          var json = { user_id: self, friend_id: id };
          listfriend = listfriend.filter(e => e.id !== id);
          // friend = friend.filter(e => e !== json);
          $("#friendslist").click();
        } else if (usertype == 'buissness') {
          // var json = { user_id: self, colleague_id: id };
          listbuissness = listbuissness.filter(e => e.id !== id);
          // buissnes = buissnes.filter(e => e !== json);
          $("#buissnesslist").click();
        } else {
          // var json = { user_id: self, relative_id: id };
          listrelatives = listrelatives.filter(e => e.id !== id);
          // relative = relative.filter(e => e !== json);
          $("#relativeslist").click();
        }

      },
      error: function (result) {
        alert('ALready added or does not exits');
      }
    });
  })
  $("#contactform").on('submit', function (e) {
    e.preventDefault();
    var user = users.filter(e => e.email === self)[0];
    $.ajax({
      type: "POST",
      url: "/users/addcontact",
      data: {
        name: $("#contactname").val(),
        email: $("#contactemail").val(),
        type: $("#type").val(),
        id: user.id
      },
      success: function (result) {
        console.log(result)
        var json = JSON.parse(result);
        relations.push({ user_id1: user.id, user_id2: json.id, type: json.type });
        var type = $("#type").val();
        var id = json.id;
        var user2 = users.filter(e => e.id === id)[0];
        console.log(user2);
        for (var i = 0; i < onlineusers.length; i++) {
          var onlineemail = onlineusers[i].email;
          if (onlineemail == user2.email) {
            if (type == 'friend')
              listfriend.push(user2);
            else if (type == 'buissness')
              listbuissness.push(user2);
            else
              listrelatives.push(user2);
          }
        }
        $("#addcontact").slideUp();
        $("#cover").fadeOut();
      },
      error: function (result) {
        alert('ALready added or does not exits');
      }
    });
  })
  $("#add").on('click', function (e) {
    $("#addcontact").slideDown();
    $("#cover").fadeIn();
  })
  $("#addclose").on('click', function (e) {
    $("#addcontact").slideUp();
    $("#cover").fadeOut();
  })
  //CODE FOR WEBRTC AND VIDEO CHAT STARTS HERE....

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  var localVideoElement = document.getElementById('localScreen');
  var remoteVideoElement = document.getElementById('remoteScreen');
  //Streams
  var localStream, remoteStream;
  //Data channel Information
  var sendChannel, receiveChannel;
  //Flags
  var isStarted = false;
  //the PeerConnection object
  // var pc;
  //PeerConnection ICE protocol configuration for chrome
  var pc_config = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };
  var pc_constraints = {
    'optional': [{ 'DtlsSrtpKeyAgreement': true }]
  };
  var sdpConstraints = {};
  var remoteUser = '';

  function callerSuccess(mediaStream) {

    localStream = mediaStream;
    localVideoElement.srcObject = mediaStream;
    pc = new RTCPeerConnection(pc_config, pc_constraints);
    console.log('Peer connection created ' + pc);
    pc.addStream(mediaStream);

    pc.onaddstream = function (streamEvent) {
      remoteStream = streamEvent.stream;
      console.log('Remote Stream: ' + remoteStream);
      remoteVideoElement.srcObject = streamEvent.stream;
      $('#callStatus').html('Call in progress...');
    };
    pc.onicecandidate = function (e) {
      var candidate = e.candidate;
      if (candidate) {
        console.log('Caller Candidate Log: ' + candidate);
        socket.emit('candidate', { targetUser: remoteUser, candidate: candidate });
      }
    };
    pc.createOffer(function (offerSDP) {
      pc.setLocalDescription(offerSDP);
      console.log('Creating offer to remote user ' + remoteUser);
      socket.emit('offersdp', { targetUser: remoteUser, offerSDP: offerSDP });
    }, onfailure, sdpConstraints);

    function onfailure(e) {
      alert('PC failed somewhat:' + e);
    }
  };

  function errorCallback(e) {
    alert('Something wrong happened:' + e.toString());
  }
  $(document).on('click', "#personName", function (e) {
    $profile.slideDown();
    $("cover").fadeIn();
  });
  ($cross).on('click', function (e) {
    $profile.slideUp();
    $("cover").fadeOut();
  });
  $("#update").on('click', function (e) {
    console.log(self)
    // $("")
    $.ajax({
      type: "POST",
      url: "/profile",
      data: {
        email: self
      },
      success: function (result) {
        console.log('profile hain');
        var user = users.filter(e => e.email === self)[0];
        $("#prevemail").val(user.email);
        $("#prevname").val(user.name);
        $("#previmage").val(user.image);
        $("#previd").val(user.id);
        $("#updateprofile").slideDown();
        $profile.slideUp();
        $("#cover").fadeIn();
      },
      error: function (result) {
        alert('Incorrect Details');
      }
    });
  });
  $("#cancel").on('click', function (e) {
    $("#updateprofile").slideUp();
    $("#cover").fadeOut();
  });
  //code for caller
  $(document).on('click', '#chatWrap #userList #food-table .pickup-button, #listWrap #contacts .pickup-button', function (e) {
    e.preventDefault();
    if (!isStarted) {
      // console.log(remoteUser)
      remoteUser = $(this).attr('id')
      console.log(remoteUser)
      console.log('Trying to start a call. Current call started status :' + isStarted);
      if (remoteUser != '' && remoteUser != self) {
        console.log('Call request from ' + self + ' to ' + remoteUser);
        $('#video-chat').slideDown();
        $('#cover').fadeIn();
        console.log(self + ' ' + remoteUser);
        socket.emit('newVideoChatRequest', { sender: self, receiver: remoteUser }, function (data) {
          $('#remoteUser').val('');
          if (data.response) {
            console.log('Your call was accepted!')
            $('#callStatus').html('Call accepted. Initiating video call now. Please, Allow Media Access to continue.');
            $('#video-chat').children('h3').css('background-color', '#99CC00');
            if (navigator.getUserMedia) {
              navigator.getUserMedia({ video: true, audio: true }, callerSuccess, errorCallback);
            } else
              $('#callStatus').html('Your browser does not support getUserMedia. Please update your broswer to use this app.');
            isStarted = true;
          } else {
            console.log('Your call request was either rejected or the user is busy');
            $('#callStatus').html('Call Failed. Reason: ' + data.reason);
          }

        });
      } else
        alert('Please enter a valid remote user name');
    } else {
      $('#callStatus').html('You are already on a call');
    }
  });
  $('#cancelCall').on('click', function (e) {
    e.preventDefault();
    hangup();
  });
  socket.on('hangup', function (data) {
    console.log('hangup request from ' + data.reqSource + ' to ' + data.target);
    if (data.target == self && data.reqSource == remoteUser) {
      console.log('Call hang up request to me!');
      remoteHangup();
    }
  });

  function hangup() {
    if (isStarted)
      socket.emit('hangup', { target: remoteUser, reqSource: self });
    remoteHangup();
  }

  function remoteHangup() {
    if (pc) {
      pc.close();
      pc = null;
    }
    isStarted = false;
    if (remoteStream) {
      // var stream = remoteStream.remoteVideoElement.srcObject;
      const tracks = remoteStream.getTracks();

      tracks.forEach(function (track) {
        console.log(`Stopping remote track ${track}`);
        track.stop();
      });
      // remoteStream.stop();
      // remoteVideoElement.srcObject = null;
    }
    if (localStream) {
      // var stream = localStream.localVideoElement.srcObject;
      const tracks = localStream.getTracks();

      tracks.forEach(function (track) {
        console.log(`Stopping local track`);
        console.log(track);

        track.stop();
      });
      // localStream.stop();
      // localVideoElement.srcObject = null;
    }
    remoteUser = '';
    $('#callStatus').html('Call ended!');
    $('#video-chat').slideUp();
    $('#cover').fadeOut();
  }
  //Code for answerer!!


  function createAnswer(offerSDP) {

    //first set remote descriptions based on offerSDP
    var remoteDescription = new RTCSessionDescription(offerSDP);
    pc.setRemoteDescription(remoteDescription);
    pc.createAnswer(function (answerSDP) {
      pc.setLocalDescription(answerSDP);
      socket.emit('answersdp', { targetUser: remoteUser, answerSDP: answerSDP });
    }, function (e) { alert('something wrong happened :' + e); }, sdpConstraints);
    
  };
  let newVideoCallRequestCallback;
  $div = $('.callRequest');
  $div.on('click', '.green', function () {
    isStarted = true;
    newVideoCallRequestCallback({ response: true, reason: 'accepted' });
    $div.slideUp();
    $('#video-chat').slideDown();
    $('#video-chat').children('h3').css('background-color', '#99CC00');
    $('#callStatus').html('Call accepted. Initiating video call now. Please, allow Media Access when asked for.');
    console.log("Going to acuqire user Media");
    navigator.getUserMedia({ video: true, audio: true }, answererSuccess, errorCallback);

    function answererSuccess(mediaStream) {
      localStream = mediaStream;
      localVideoElement.srcObject = mediaStream;
      pc = new RTCPeerConnection(pc_config, pc_constraints);
      console.log('Peer connection created ' + pc);
      pc.addStream(mediaStream);
      pc.onaddstream = function (streamEvent) {
        remoteStream = streamEvent.stream;
        console.log('Remote Media Stream: ' + remoteStream);
        remoteVideoElement.srcObject = streamEvent.stream;
        $('#callStatus').html('Call in progress...');
      };
      pc.onicecandidate = function (e) {
        var candidate = e.candidate;
        if (candidate) {
          socket.emit('candidate', { targetUser: remoteUser, candidate: candidate });
        }
      };
    }
  });
  $div.on('click', '.red', function () {
    isStarted = false;
    newVideoCallRequestCallback({ response: false, reason: 'rejected' });
    $div.slideUp();
    $('#cover').fadeOut();
  });
  socket.on('newVideoCallRequest', function (data, callback) {
    console.log('New Video Call Request. Current call started status :' + isStarted);
    if (!isStarted) {
      newVideoCallRequestCallback = callback;
      remoteUser = data.from;
      var caller = users.filter(e => e.email === remoteUser)[0];
      $div.find('#caller').text('Username : ' + caller.name + ' Email : ' + caller.email);
      $div.slideDown();
      $('#cover').fadeIn();
    } else {
      callback({ response: false, reason: 'busy' });
    }
  });
  //Handlers for sockets
  socket.on('candidate', function (data) {
    if (pc)
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  });
  socket.on('offersdp', function (data) {
    console.log(self + ':: offer received. target user is ' + data.targetUser);
    if (data.targetUser == self && data.offerSDP) {
      console.log('Receiver reaches here. Not the offerer.');
      createAnswer(data.offerSDP);
    }
  });
  socket.on('answersdp', function (data) {
    if (data.targetUser == self && data.answerSDP) {
      console.log('Offerer reaches here. Not the receiver.');
      var remoteDescription = new RTCSessionDescription(data.answerSDP);
      pc.setRemoteDescription(remoteDescription);
    }
  });
});