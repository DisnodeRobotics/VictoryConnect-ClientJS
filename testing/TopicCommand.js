const Client = require("../src/Client");

var client = new Client("topic-pub-js","Topic Sub JS Client");
client.enableTCP();

client.callCommand("stop_bot","No Wifi");