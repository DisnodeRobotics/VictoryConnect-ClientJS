const Client = require("../src/VictoryConnectLib").Client;
const Moment = require("moment");
var client = new Client("testing-command-send", "Victory Connect Client Testing NodeJS", false);
client.EnableTCP("127.0.0.1", 5000).then(() => {
    client.SetDefaultConnectionType("TCP");

    setInterval(()=>{
        client.CallCommand("test/command1", new Date());
    }, 3000);
});