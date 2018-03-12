var VCClientClass = require("./").Client;
console.log(require("./index.js"))
var client = new VCClientClass("TestLibClientJS");

client.Connect();
client.on("connected",()=>{
    console.log("Connected!");
    client.Subscribe("gyro");
});

client.on("gyro",(data)=>{
    console.log("GYRO: " + data);
});