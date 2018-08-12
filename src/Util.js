var logger = require("disnode-logger")
exports.parse = function (data) {
  data = data.toString();

  if (data.indexOf("~") == -1) {

    //logger.Info("VC Server", "", `Packet from \nSubject: ${subject} \nType: ${commandType} \nTopic: ${commandTopic} \nData: ${values}`)
    return [parseSinglePacket(data)];
  } else {
    var packets = data.split("~");
    packets.splice(packets.length - 1, 1);
    var returnPackets = [];
    for (var i = 0; i < packets.length; i++) {
      var _packet = packets[i];
      returnPackets.push(parseSinglePacket(_packet));
    }
    return returnPackets;
  }
  return null;

};

function parseSinglePacket(data) {
  var parts = data.split(" ");
  var commandType = parts[0];
  var commandTopic = parts[1];
  var valuesString = data.substring(data.indexOf("{") + 1, data.indexOf("}"));
  var values = [valuesString];
  if (valuesString.indexOf(";") != -1) {
    values = valuesString.split(";");
  }
  return {
    raw: data,
    type: parseInt(commandType),
    path: commandTopic,
    dataString: valuesString,
    data: values
  }
}

exports.buildPacket = function (type, topic, data) {
  if (typeof (data) === "String") {
    return type + " " + topic + " " + "{" + data + "}"
  } else {

    return type + " " + topic + " " + "{" + data.join(';') + "}"
  }


  //  logger.Info("VC Server", "", `Packet from ${info.address}:${info.port} \nSubject: ${subject} \nType: ${commandType} \nTopic: ${commandTopic} \nData: ${values}`)
};
