const Client = require("../src/Client");

var client = new Client("topic-pub-js","Topic Sub JS Client");
client.enableTCP("10.0.0.17", 5000);

client.on("ready", ()=>{
    client.addSource("test/js/1", "TCP", ()=>{
        return Math.random();
    });
})