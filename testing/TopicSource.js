const Client = require("../src/Client");

var client = new Client("topic-pub-js","Topic Sub JS Client");
client.enableTCP();

client.addSource("test/js/1", "TCP", ()=>{
    return new Date().getTime();
})
