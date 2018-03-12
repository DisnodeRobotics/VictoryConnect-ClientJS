var logger = require("disnode-logger")
exports.parse = function (data) {
  data = data.toString();
  
  var parts = data.split(" ");
  var subject = parts[0];
  var commandType = parts[1];
  var commandTopic = parts[2];
  var valuesString = data.substring(data.indexOf("{") + 1, data.indexOf("}"));
  var values = [valuesString];
  if(valuesString.indexOf(";") != -1){
    values = valuesString.split(";");
  }
  
  return{
    raw: data,
    subject:  parseInt(subject),
    type: parseInt(commandType),
    topic: commandTopic,
    dataString: valuesString,
    data: values
  }

 
};

exports.buildPacket = function (subject, type, topic, data) {
  return subject + " " + type + " " + topic + " " + "{" + data + "}"

};
