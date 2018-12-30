const Client = require("../src/Client");

var client = new Client("topic-sub-js","Topic Sub JS Client");
client.enableTCP("10.0.0.17", 5000);

client.on('ready', ()=>{
    console.log("READY");
    
    client.subscribe("*",(packet)=>{
        console.log(packet.data[0]);
    })
});

