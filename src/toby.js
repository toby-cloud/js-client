
/**
 * Bot constructor
 *
 * @param  {String}   botId         description
 * @param  {String}   secret        description
 * @param  {Function} on_connect    description
 * @param  {Function} on_disconnect description
 * @param  {Function} on_message    description
 */
function Bot(botId, secret, on_connect, on_disconnect, on_message) {
  var botId = botId;
  var secret = secret;
  var on_disconnect = on_disconnect;
  var on_connect = on_connect;
  var on_message = on_message;
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
      client.subscribe("client/" + botId);
      on_connect();
    }

    function doFail(e) {
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
      obj = JSON.parse(message.payloadString);
      on_message(obj);
    }
  };

  /**
   * start - start the bot
   */
  this.start = function () {
    console.log("starting mqtt")
    mqttStart();
  }

  /**
   * stop - disconnect from Toby
   */
  this.stop = function() {
    client.disconnect();
  }

  /**
   * send - send a message
   *
   * @param  {Object} payload the message payload
   * @param  {Array} tags    list of tags
   * @param  {String} ack    the ack tag
   */
  this.send = function (payload, tags, ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({payload: payload, tags: tags, ack: ack}));
    request.destinationName = "server/" + botId + "/send";
    client.send(request);
  }

  /**
   * follow - add bot subscriptions
   *
   * @param  {Array} tags the tags to follow
   * @param  {String} ack  the ack tag
   */
  this.follow = function(tags, ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({tags: tags, ack: ack}));
    request.destinationName = "server/" + botId + "/follow";
    client.send(request);
  }

  /**
   * unfollow - remove bot subscriptions
   *
   * @param  {Array} tags the tags to unfollow
   * @param  {String} ack  the ack tag
   */
  this.unfollow = function(tags, ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({tags: tags, ack: ack}));
    request.destinationName = "server/" + botId + "/unfollow";
    client.send(request);
  }

  /**
   * info - get bot information
   *
   * @param  {String} ack  the ack tag
   */
  this.info = function(ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({ack:ack}));
    request.destinationName = "server/" + botId + "/info";
    client.send(request);
  }

  /**
   * createBot - create a standard bot (users only)
   *
   * @param  {String} name     the bot's ID
   * @param  {String} password the bot's SK
   * @param  {String} ack      the ack tag
   */
  this.createBot = function(name, password, ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({id: name, sk: password, ack: ack}));
    request.destinationName = "server/" + botId + "/create-bot";
    client.send(request);
  }

  /**
   * createSocket - create a socket bot (standard bots only)
   *
   * @param  {boolean} persist description
   * @param  {String} ack  the ack tag
   */
  this.createSocket = function(persist, ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({persist: persist, ack: ack}));
    request.destinationName = "server/" + botId + "/create-socket";
    client.send(request);
  }

  /**
   * removeBot - remove a bot (users only)
   *
   * @param  {String} targetId the ID of the bot to delete
   * @param  {String} ack  the ack tag
   */
  this.removeBot = function(targetId, ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({id: targetId, ack: ack}));
    request.destinationName = "server/" + botId + "/remove-bot";
    client.send(request);
  }

  /**
   * removeSocket - remove a socket (standard bots only)
   *
   * @param  {String} targetId the ID of the socket to delete
   * @param  {String} ack  the ack tag
   */
  this.removeSocket = function(targetId, ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({id: targetId, ack: ack}));
    request.destinationName = "server/" + botId + "/remove-socket";
    client.send(request);
  }

  /**
   * enableHooks - turn on bot web hooks
   *
   * @param  {String} hookSk the hook secret
   * @param  {String} ack  the ack tag
   */
  this.enableHooks = function(hookSk, ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({sk: hookSk, ack: ack}));
    request.destinationName = "server/" + botId + "/hooks-on";
    client.send(request);
  }

  /**
   * disableHooks - turn off bot web hooks
   *
   * @param  {String} ack  the ack tag
   */
  this.disableHooks = function(ack) {
    var request = new Paho.MQTT.Message(JSON.stringify({ack: ack}));
    request.destinationName = "server/" + botId + "/hooks-off";
    client.send(request);
  }

}

/** ------------------------- Helper Methods ------------------------------- **/

/**
* isArray - check if valid array
*
* @param  {Array} a the value to test
* @return {boolean}  returns true if parameter is an array, false otherwise
*/
function isArray(a) {
  return Array.isArray(a)
}

/**
 * isString - check if valid string
 *
 * @param  {String} s the value to test
 * @return {boolean}  returns true if parameter is string, false otherwise
 */
function isString(s) {
  return (typeof s === 'string' || s instanceof String);
}

/**
* isString - check if valid string
*
* @param  {boolean} b the value to test
* @return {boolean}  returns true if parameter is boolean, false otherwise
*/
function isBoolean(b) {
  return typeof(b) === "boolean";
}

/**
 * isString - check if valid string
 *
 * @param  {String} s the value to test
 * @return {boolean}  returns true if parameter is string, false otherwise
 */
function isString(s) {
  return (typeof s === 'string' || s instanceof String);
}

/**
 * isJsonObject - description
 *
 * @param  {type} obj description
 * @return {type}     description
 */
function isJsonObject(obj) {
  return isJsonString(JSON.stringify(obj));
}

/**
 * isJsonString - check if string is valid json
 *
 * @param  {String} jsonString the string to check
 * @return {boolean}           true if valid json, false otherwise
 */
function isJsonString(jsonString) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return true;
        }
    }
    catch (e) { }

    return false;
};

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
