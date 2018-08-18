const Client = require("./VictoryConnectLib").Client;

var client = new Client("testing-js", "Victory Connect Client Testing NodeJS", true);

client.EnableTCP("127.0.0.1", 5000).then(() => {
    client.SetDefaultConnectionType("TCP");
});

client.EnableUDP("127.0.0.1", 5001, () => {

});

client.NewTopic("Testing Topic 1", "test/1", "UDP");
client.Subscribe("test/", (update) => {
    console.log(`${update.path} -> ${update.data} from ${update.connection}`);
});

client.SetTopic("test/1", "Active!");