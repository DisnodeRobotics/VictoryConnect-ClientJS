const Client = require("../src/VictoryConnectLib").Client;
const Moment = require("moment");
var client = new Client("testing-command-recv", "Victory Connect Client Testing NodeJS", false);
client.EnableTCP("127.0.0.1", 5000).then(() => {
    client.SetDefaultConnectionType("TCP");

    client.Subscribe("test/source", (data)=>{
        var packetTime = parseInt(data.data[0]);
        var currentTime = new Date().getTime();

        console.log("Ping: " + (currentTime-packetTime)+"ms");
        
        
    })
});