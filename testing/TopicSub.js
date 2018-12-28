const Client = require("../src/Client");

var client = new Client("topic-sub-js","Topic Sub JS Client");
client.enableTCP();

client.on('ready', ()=>{
    console.log("READY");
    
    client.subscribe("test/js/1",(packet)=>{
        console.log(packet.data[0]);
    })
});

