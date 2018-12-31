const Client = require("../src/Client");

var client = new Client("topic-sub-js","Topic Sub JS Client");

client.useMDNS(
    // TCP
    (ip, port)=>{
        client.enableTCP(ip,port)
    },  
    //UDP
    (ip, port)=>{
       client.enableUDP(ip,port)
    }
);

client.on('ready', ()=>{
    console.log("READY");
    
    client.subscribe("pathfinder/",(packet)=>{
        console.log(packet.data);
    })
});

