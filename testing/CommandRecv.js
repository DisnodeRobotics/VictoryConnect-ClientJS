const Client = require("../src/VictoryConnectLib").Client;
const Moment = require("moment");
var client = new Client("testing-command-recv", "Victory Connect Client Testing NodeJS", false);
client.EnableTCP("127.0.0.1", 5000).then(() => {
    client.SetDefaultConnectionType("TCP");

    client.RegisterCommand("test/command1", (data)=>{
        let date = new Date(data.data[0]);
        let ping = new Date().getTime() - date.getTime();
        console.log(`Command test/command1. Ping ${ping}`);
    });
});