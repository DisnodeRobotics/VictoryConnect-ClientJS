const Packet = require("../networking/Packet");

module.exports.parse = function (data) {
    data = data.toString();
  
    if (data.indexOf("~") == -1) {
  
      //logger.Info("VC Server", "", `Packet from \nSubject: ${subject} \nType: ${commandType} \nTopic: ${commandTopic} \nData: ${values}`)
      return [parseSinglePacket(data)];
    } else {
      var packets = data.split("~");
    
      var returnPackets = [];
      for (var i = 0; i < packets.length; i++) {
        var _packet = packets[i];
        _packet = parseSinglePacket(_packet);
        if(_packet.isValid()){
            returnPackets.push(_packet);
        }
       
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
    
    var packet = new Packet(parseInt(commandType), commandTopic, values);
    packet.setRaw(data);

    return packet;
  }
  