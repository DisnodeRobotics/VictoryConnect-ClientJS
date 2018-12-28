const Client = require("../src/Client");

var client = new Client("topic-pub-js","Topic Sub JS Client");
client.enableTCP();

client.on('ready', ()=>{
    console.log("READY");
    
    client.newTopic("Test JS Topic #1", "test/js/1", "TCP");
    setInterval(()=>{
        client.setTopic("test/js/1", [new Date().getTime()]);
    }, 1000);
});

