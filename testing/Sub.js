const Client = require("../src/VictoryConnectLib").Client;
const Moment = require("moment");
var client = new Client("testing-pub", "Victory Connect Client Testing NodeJS", false);
client.EnableTCP("127.0.0.1", 5000).then(() => {
    client.SetDefaultConnectionType("TCP");

    client.Subscribe("test/pub", (update)=>{
        let date = parseInt(update.data[0])
        let ping = new Date().getTime() -date;
        console.log(`Packertest/pub. Ping ${ping}`);
    });
});