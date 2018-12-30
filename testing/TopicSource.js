const Client = require("../src/Client");

var client = new Client("topic-pub-js","Topic Sub JS Client");

client.useMDNS(
    // TCP
    (ip, port)=>{
        client.enableTCP(ip,port)
    },  
    //UDP
    (ip, port)=>{
        
    }
);

client.on("ready", ()=>{
    client.addSource("test/js/1", "TCP", ()=>{
        return Math.random();
    });
})