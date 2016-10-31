

/**
 * Toby - description
 *
 * @param  {String} botId         description
 * @param  {String} secret        description
 * @param  {Function} on_connect    description
 * @param  {Function} on_disconnect description
 * @param  {Function} on_message    description
 * @return {type}               description
 */
function Toby(botId, secret, on_connect, on_disconnect, on_message) {
  var botId = botId;
  var secret = secret;
  var on_disconnect = on_disconnect;
  var on_connect = on_connect;
  var client = false;

  var mqttStart = function() {
    // Create a client instance
    client = new Paho.MQTT.Client("toby.cloud", 446, botId);

    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    var options = {
      useSSL: false,
      userName: botId,
      password: secret,
      onSuccess: onConnect,
      onFailure: doFail
    }

    // connect the client
    client.connect(options);

    // called when the client connects
    function onConnect() {
      // Once a connection has been made, make a subscription and send a message.
      client.subscribe("client/" + botId + "/#");
      on_connect();
    }

    function doFail(e){
      alert("Unable to connect to Toby");
    }

    // called when the client loses its connection
    function onConnectionLost(responseObject) {
      if (responseObject.errorCode !== 0) {
        //console.log("onConnectionLost:"+responseObject.errorMessage);
        on_disconnect();
      }
    }

    // called when a message arrives
    function onMessageArrived(message) {
      var from = message.destinationName.split("/").splice(2).join("/");
      on_message(from, JSON.parse(message.payloadString));
    }
  };

  this.start = function () {
    console.log("starting mqtt")
    mqttStart();
  }

  this.send = function (m) {
    var message = new Paho.MQTT.Message(m);
    message.destinationName = "server/" + botId + "/send";
    client.send(message);
  }

  this.follow = function(hashtag_string, ackTag) {
    var payload = {
      tags: findHashtags(hashtag_string),
      ackTag: ackTag
    }
    var message = new Paho.MQTT.Message(JSON.stringify(payload));
    message.destinationName = "server/" + botId + "/follow";
    client.send(message);
    console.log("followed", hashtag_string);
  }

  this.info = function(ackTag) {
    var message = new Paho.MQTT.Message(JSON.stringify({ackTag:ackTag}));
    message.destinationName = "server/" + botId + "/info";
    client.send(message);
  }

  this.getBots = function(ackTag) {
    var message = new Paho.MQTT.Message(JSON.stringify({ackTag:ackTag}));
    message.destinationName = "server/" + botId + "/bots";
    client.send(message);
  }

  this.createBot = function(name, password, ackTag) {
    var message = new Paho.MQTT.Message(JSON.stringify({id: name, secret: password, ackTag: ackTag}));
    message.destinationName = "server/" + botId + "/create-bot";
    client.send(message);
  }

  this.removeBot = function(targetId, ackTag) {
    var message = new Paho.MQTT.Message(JSON.stringify({botId: targetId, ackTag: ackTag}));
    message.destinationName = "server/" + botId + "/remove-bot";
    client.send(message);
  }

}

/**
 * removeHashtags - remove hashtags from a string
 *
 * @param  {String} text the string to remove hashtags from
 * @return {String}      the string with hashtags removed
 */
removeHashtags = function(text) {
  var regexp = new RegExp('#([^\\s]*)','g');
  return text.replace(regexp, '').trim();
}

/**
 * findHashtags - extract all hashtags from a string
 *
 * @param  {String} text the text to extract hashtags from
 * @return {list}   list of hashtags found in string
 */
findHashtags = function(text) {
  var regexp = /(\s|^)\#\w\w+\b/gm
  text = text + " ";
  result = text.match(regexp);
  if (result) {
    result = result.map(function(s){ return s.trim().substring(1);});
    return result;
  } else {
    return [];
  }
}
