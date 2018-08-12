const Client = require("./VictoryConnectLib").Client;

var client = new Client("testing-js", "Victory Connect Client Testing NodeJS", true);

client.EnableTCP("127.0.0.1", 5000, () => {
    client.SetDefaultConnectionType("TCP");
    client.NewTopic("Testing Topic 1", "test/1", "TCP");
});

client.EnableUDP("127.0.0.1", 5001, ()=>{
    
})