const Client = require("./VictoryConnectLib").Client;
const Moment = require("moment");
var client = new Client("testing-js", "Victory Connect Client Testing NodeJS", false);

client.EnableTCP("127.0.0.1", 5000).then(() => {
    client.SetDefaultConnectionType("TCP");
    client.NewTopic("Testing Ping", `clients/${client.id}/ping`, "UDP");

    setInterval(() => {
        client.SetTopic(`clients/${client.id}/ping`, new Moment());
        client.GetTopic("*");
        
       
         setTimeout(() => {
             const keys = Object.keys(client.topics);
            console.log('====================================');
            console.log("TOPIC LIST: " + `(Keys ${keys.length})` + new Date());
            for (let i = 0; i < keys.length; i++) {
                const topic = client.topics[keys[i]];
                console.log(`Topic: ${keys[i]}\n --- Value: ${topic}`)
            }
            console.log('====================================');
           
        }, 400);
    
    }, 1000);
});

client.EnableUDP("127.0.0.1", 5001, () => { });


