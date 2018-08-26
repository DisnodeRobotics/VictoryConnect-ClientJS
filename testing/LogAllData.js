const Client = require("./VictoryConnectLib").Client;
const Moment = require("moment");
var client = new Client("testing-js", "Victory Connect Client Testing NodeJS", false);

client.EnableTCP("127.0.0.1", 5000).then(() => {
    client.SetDefaultConnectionType("TCP");

    setInterval(() => {
    
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
    
    }, 3000);
});

client.EnableUDP("127.0.0.1", 5001, () => { });


