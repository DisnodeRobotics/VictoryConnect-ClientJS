const Client = require("../src/VictoryConnectLib").Client;
const Moment = require("moment");
var client = new Client("testing-pub", "Victory Connect Client Testing NodeJS", false);
client.EnableUDP("127.0.0.1", 5001).then(() => {
    client.SetDefaultConnectionType("UDP");

    client.NewTopic("Test Pub", "test/pub", "UDP");

    setInterval(()=>{
        client.SetTopic("test/pub", new Date().getTime());
        console.log("sent.")
    }, 1000);
});