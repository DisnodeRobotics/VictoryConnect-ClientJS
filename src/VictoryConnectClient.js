const Logger = require("disnode-logger");
const net = require('net');
const Util = require("./Util")
const Consts = require("./Consts")
const client = new net.Socket();
const EventEmitter = require('events');

class VictoryConnectClient  extends EventEmitter {
    constructor(id="VictoryConnectClientJS", ip = Consts.connnection.DEFAULT_IP, port = Consts.connnection.DEFAULT_PORT) {
        super();
        this.id = id;
        this.ip = ip;
        this.port = port;

        this.listeners = "";

        this.connected = false;

        var self = this;
        client.on("error", (err)=>self.OnSocketError(err));
        client.on("data", (data)=>self.OnRawData(data));
    }

    Connect() {
        var self = this;
        Logger.Info("VictoryConnectClient", "Connect", `Connecting to server: ${self.ip}:${self.port}...`)
       
        client.connect(self.port, self.ip, function () {
            Logger.Success("VictoryConnectClient", "Connect", `Conected to server: ${self.ip}:${self.port}!`)
           
            
            Logger.Info("VictoryConnectClient", "Connect", `ID'ing to server with ID: ${self.id}`);
            self.SendPacket(Consts.types.SUBMIT,"id", self.id, true);
       
          
    
           
           
        });

    }

    ConnectNew(ip, port) {
        this.ip = ip;
        this.port = port;
        this.Connect();

        
    }

    Disconnect() {
        
    }

    Reconnect() {
        Logger.Warning("VictoryConnectClient", "Reconnect", "Attemtping reconnect in: " + Consts.connnection.RECONNECT_TIME + "ms");
        setTimeout(()=>{
            this.Connect();
        }, Consts.connnection.RECONNECT_TIME);
    }

    OnSocketError(err){
        Logger.Error("VictoryConnectClient", "OnSocketError", "Error: " + err.message);
        this.connected = false;
        this.Reconnect();
    }

    

    // Socket Events

    OnRawData(data){
        var self = this;
        data = data.toString();
        if(!data || data.length < 3){
            Logger.Error("VictoryConnectPacket", "OnRawData", "Malformed Data Recieved (length < 3): " + data.toString);
            return;
        }
        var parsedPacket = Util.parse(data);

        switch(parsedPacket.type){
            case Consts.types.ERROR:
            break;
            case Consts.types.SUBMIT:
                self.OnSubmit(parsedPacket);
            break;
            case Consts.types.REQUEST:
                self.OnRequest(parsedPacket);
            break;
        }
    }


    OnSubmit(packet){
        var self = this;

        if(packet.topic == "welcome"){
            self.connected = true;
            self.emit("connected");
        }
        
        this.emit(packet.topic, packet.data);
        this.emit("submit", packet);
    }

    OnRequest(packet){
        if(packet.topic == "heartbeat"){
            this.OnHeartBeat();
        }else{
            this.emit(packet.topic, packet.data);
            this.emit("request", packet);
        }
    }

    OnHeartBeat(){
        this.SendPacket(Consts.types.SUBMIT, "heartbeat", "no_data");
    }

    // Public Functions

    Subscribe(topic){
        Logger.Info("VictoryConnectClient", "Subscribe", "Subscribing to topic: " + topic);
        this.SendPacket(Consts.types.SUBMIT, "subscribe", topic);
    }

    SendPacket(type, topic, data, override=false){
        if(this.connected || override){
            client.write(Util.buildPacket(-1,type,topic,data));
        }else{
            Logger.Warning("VictoryConnectClient", "SendPacket", "Attempted to send packet while connection is false");
        }
    }
}

module.exports.Client = VictoryConnectClient;
module.exports.Util = Util;
module.exports.Consts = Consts;