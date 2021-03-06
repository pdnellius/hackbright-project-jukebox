$(function() {

  // Set up Audio Context
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  var context = new AudioContext();
  var songBuffer = null;

  var buffAudio = new BuffAudio(context, songBuffer);

  // WebSocket setup
  var playlistSocket = new WebSocket("ws://" + document.domain + ":5000/playlist_socket/");

  // WebSocket on-open
  playlistSocket.onopen = function () {
    
    // Get current jukebox playlist
    $.get("/jukebox_id", function (data) {
      console.log(data);
      
      playlistSocket.send('{"jukebox_id" : ' + '"' + data['jukebox_id'] + '" ,' +
                          '"first_load" : ' + '"yes"' + '}');
    });

      console.log("Socket Opened");
  };

  // WebSocket on-message
  playlistSocket.onmessage = function (evt) {

    // Parse data from server for song object
    var songObj = JSON.parse(evt['data']);

    // If data contains song, renders new row to sockets.
    if (songObj['new_song']) {

      if (songObj['order'] === 0) {
        $('#playlist-display').empty();
      }

      playlistRow = "<tr id=" + "'" + songObj['song_user_id'] + "'" + ">" +
                     "<td class='song-name'>" + songObj['song_name'] + "</td>" +
                     "<td class='song-artist'>" + songObj['song_artist'] + "</td>" +
                     "<td class='song-album'>" + songObj['song_album'] + "</td>" +
                     "<td class='song-votes'>" + songObj['song_votes'] + "</td>" +
                     "</tr>";

      $('#playlist-display').append(playlistRow);
    }

    // Re-render playlist based on vote
    if (songObj['vote_update']) {
      
      if (songObj['order'] === 0) {
        $('#playlist-display').empty();
      }

      playlistRow = "<tr id=" + "'" + songObj['song_user_id'] + "'" + ">" +
                     "<td class='song-name'>" + songObj['song_name'] + "</td>" +
                     "<td class='song-artist'>" + songObj['song_artist'] + "</td>" +
                     "<td class='song-album'>" + songObj['song_album'] + "</td>" +
                     "<td class='song-votes'>" + songObj['song_votes'] + "</td>" +
                     "</tr>";

      $('#playlist-display').append(playlistRow);
    }

    // Re-render playlist based on playing
    if (songObj['play']) {
      
      console.log(songObj);

      if (songObj['order'] === 0) {
        $('#playlist-display').empty();
      }

      playlistRow = "<tr id=" + "'" + songObj['song_user_id'] + "'" + ">" +
                     "<td class='song-name'>" + songObj['song_name'] + "</td>" +
                     "<td class='song-artist'>" + songObj['song_artist'] + "</td>" +
                     "<td class='song-album'>" + songObj['song_album'] + "</td>" +
                     "<td class='song-votes'>" + songObj['song_votes'] + "</td>" +
                     "</tr>";

      $('#playlist-display').append(playlistRow);
    }

    // Empty playlist render
    if (songObj['empty_playlist']) {
      $('#playlist-display').empty();
    }
  };

  // Player socket setup
  var playerSocket = new WebSocket("ws://" + document.domain + ":5000/player_socket/");

  playerSocket.onopen = function() {
    console.log("HURRAH");
      $.get("/jukebox_id", function (data) {
      console.log(data);
      var loginData = '{"jukebox_id" : ' + '"' + data['jukebox_id'] + '" ,' +
                      '"first_load" : ' + '"yes"' + '}';
      console.log(loginData);
      playerSocket.send(loginData);
    });

  };

  // Fix up prefixing
  function loadSound() {
    var request = new XMLHttpRequest();
    request.open('GET', "/play_song", true);
    request.responseType = 'arraybuffer';

    request.onload = function(evt) {
      console.log("we are now in onload");
      console.log(request);
      context.decodeAudioData(request.response, function(buffer) {
        $('#loading-graphic').hide();
        buffAudio.initNewBuffer(buffer);
        buffAudio.play();
        // playSound();
      },
      function (err) {
          console.log("ERR", err);
      });
    };
    request.send();
  }

  // function playSound() {
  //     source.buffer = songBuffer; // tell the source which sound to play
  //     source.connect(context.destination); // connect the source to the context's destination (the speakers)
  //     $('#loading-graphic').toggle();
  //     startTime = context.currentTime;
  //     source.start(0, startOffset % source.buffer.duration); // play the source now or at the point of the last pause
  //                                          // note: on older systems, may have to use deprecated noteOn(time);
  // }

  function pauseSound() {
    // source.stop();
    // startOffset += context.currentTime - startTime;
  }

  playerSocket.onmessage = function (data) {
    console.log("BELOW IS THE DATA SENT TO PLAYLIST SOCKET BY PLAYER.");
    console.log(data);
    playlistSocket.send(data['data']);
    $('#loading-graphic').show();
    setTimeout(loadSound, 10000);
  };

  // Setting player buttons
  $("#play-button").click(function() {

    // Show "now playing"
    var songName = $('.song-name')[0].textContent;
    var songArtist = $('.song-artist')[0].textContent;
    var songAlbum = $('.song-album')[0].textContent;
    var nowPlaying = "<p>Now playing: " + songName + " by " + songArtist + "</p>";
    $('#now-playing').html(nowPlaying);

    if (buffAudio._buffer === null) {
      $.get("/jukebox_id", function (data) {
        console.log(data);
        var playData = '{"jukebox_id" : ' + '"' + data['jukebox_id'] + '" ,' +
                       '"play" : ' + '"true"' + '}';
        console.log(playData);
        playerSocket.send(playData);
      });
    } else {
      // var source = context.createBufferSource();
      // source.buffer = songBuffer;
      // startTime = context.currentTime;
      // source.start(0, source.buffer.duration % startOffset); // play the source now or at the point of the last pause
      buffAudio.play();
    }
  });
  
  $("#pause-button").click(function() {
    // $.get("/jukebox_id", function (data) {
    //   console.log(data);
    //   var pauseData = '{"jukebox_id" : ' + '"' + data['jukebox_id'] + '" ,' +
    //                     '"pause" : ' + '"true"}';
    //   console.log(pauseData);
    //   playerSocket.send(pauseData);
    // });}
      buffAudio.pause();
    });

  $("#skip-button").click(function() {
    $.get("/jukebox_id", function (data) {

    var songName = $('.song-name')[0].textContent;
    var songArtist = $('.song-artist')[0].textContent;
    var songAlbum = $('.song-album')[0].textContent;
    var nowPlaying = "<p>Now playing: " + songName + " by " + songArtist + "</p>";

    $('#now-playing').html(nowPlaying);

      console.log(data);
      var playData = '{"jukebox_id" : ' + '"' + data['jukebox_id'] + '" ,' +
                     '"skip" : ' + '"true", ' +
                     '"play" : ' + '"true"' + '}';
      console.log(playData);
      // buffAudio.stop();
      buffAudio._buffer = null;
      playerSocket.send(playData);
    });
  });

  // Unique URL instant highlight
  $('.public-url').focus(function () {
    $(this).select();
  });

  // Search toggling
  $("#search-toggle").click(function() {
    $("#search-form").slideToggle(750);
  });

  // Search request
  $("#search-form").submit(function (evt){
    evt.preventDefault();

    $.get("/search", {'search-term': $('#search-term').val()}, function(data) {

      $("#search-results").slideDown(250);

      console.log(data['tracks']['items']);
      if (data['tracks']['items'].length > 0) {

      var searchResults = "";

      for (var i = 0; i < data['tracks']['items'].length; i++) {
          
        var songName = data['tracks']['items'][i]['name'],
            artist = data['tracks']['items'][i]['artists'][0]['name'],
            album = data['tracks']['items'][i]['album']['name'],
            uri = data['tracks']['items'][i]['uri'];


        searchResults += "<div><strong>Song Name:</strong> " + songName +
                          ", <strong>Artist:</strong> " + artist +
                          "<form action='/song/add' method='post' class='add-song'>" +
                          "<input type='hidden' name='song-name' value=" +
                          "'" + songName + "'>" +
                          "<input type='hidden' name='song-artist' value=" +
                          "'" + artist + "'>" +
                          "<input type='hidden' name='song-album' value=" +
                          "'" + album + "'>" +
                          "<input type='hidden' name='song-uri' value=" +
                          "'" + uri + "'>" +
                          "<input type='submit' value='Add to playlist'></form></div>";
      }

      $("#search-results").html(searchResults);

      // Adding new songs - event listener
      $('.add-song').submit(function (evt) {
        evt.preventDefault();

        formData = $(this).serialize();

        console.log(formData);

        $.post('/song/add', formData, function (data) {

            console.log(data);
            $('#search-flash').text(data['song_name'] + " has been added.").fadeIn();
            
            setTimeout(function() {
              $('#search-flash').fadeOut();
            }, 2500);

          playlistSocket.send(JSON.stringify(data));
 
        });
      });
    } else { $('#search-results').text("There are no results, sorry!"); }
    });
  });
});
