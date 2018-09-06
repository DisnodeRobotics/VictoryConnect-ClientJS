const Logger = require("disnode-logger");
const Util = require("./Util")

const EventEmitter = require('events');
const UID = require("UID")
const net = require('net');
const dgram = require('dgram');
const Consts = require("./Consts")
class Client extends EventEmitter {
    constructor(id="vc-client-js", name="Generic VictoryConnect NodeJS Client", verbose=true){
        super();
        this.id = id;
        this.name = name;
        this.sockets = {};
        this.verbose = verbose;
        this.subscriptions = [];
        this.commands = [];
        this.topics = {};
        this.heartbeatFreq = 300;
        this.heartbeatRetries = 3;
        this.requestQueue = {};
  

        if(verbose){
            Logger.Info("Client-"+this.id, "constructor", `Creating new client "${this.name}" with id ${this.id}`);
        }

        this.RegisterCommand("server/welcome",(packet)=>{
            this.heartbeatFreq = (parseInt(packet.data[0]) / 2) || 100;
            this.heartbeatLast = new Date().getTime;
            this.heartbeatRetries = parseInt(packet.data[1]) || 3;
            if(verbose){
                Logger.Success("Client-"+this.id, "constructor", `Client was welcomed! Heartbeat is now ${this.heartbeatFreq}`)
            }
        });
    
    }

    SetDefaultConnectionType(conType){
        this.defaultConType = conType;
    }

    EnableTCP(ip="127.0.0.1", port=4056){
        var self = this;
        
        return new Promise((res,rej)=>{
            self.sockets['TCP'].heartbeat = {
                active: true,
                lastPacket: new Date().getTime(),
                failedPackets: 0,
                ping: 0
            };
            self.sockets['UDP'].server = {ip: ip, port: port};
            self.sockets['TCP'] = net.createConnection(port, ip, ()=>{
                self.sockets['TCP'].on("connection", ()=>{
                    if(self.verbose){
                        Logger.Success("Client-"+this.id, "EnableTCP", "Connected to server‽‽‽")
                    }
                });
                self.sockets['TCP'].on("data", (data)=>{
                    self.OnData(data, "TCP");
                });

                self.sockets['TCP'].on("error", (data)=>{
                    Logger.Error("Client", "TCP-ERROR", data);
                    self.AttemptReconnect("TCP");
                });
                self.SendPacket( Consts.types.COMMAND, "server/register", [self.id, self.name], "TCP");

                setInterval(()=>{
                    self.SendPacket( Consts.types.COMMAND, "server/heartbeat", [new Date().getTime()], "TCP");
                    self.CheckHeartbeat("TCP");
                }, 250);

                self.RegisterCommand("server/heartbeat_resp", (packet)=>{
                    self.RecvHeartbeat(packet, "TCP");
                });
                return res();
            });
        })
    }

    EnableUDP(ip="127.0.0.1", port=4056, cb){
        var self = this;
        var self = this;
        return new Promise((res,rej)=>{
            self.sockets['UDP'] = dgram.createSocket("udp4");
            self.sockets['UDP'].server = {ip: ip, port: port};
            self.sockets['UDP'].heartbeat = {
                active: true,
                lastPacket: new Date().getTime(),
                failedPackets: 0,
                ping: 0
            };
            self.sockets['UDP'].bind();
            self.sockets['UDP'].on("listening", ()=>{
                if(self.verbose){
                    Logger.Success("Client-"+this.id, "EnableUDP", "UDP Listening")
                }
        
                self.SendPacket( Consts.types.COMMAND, "server/register", [self.id, self.name], "UDP");
                setInterval(()=>{
                    self.SendPacket( Consts.types.COMMAND, "server/heartbeat", [new Date().getTime()], "UDP");
                    self.CheckHeartbeat("UDP");
                }, 250);
                
                self.RegisterCommand("server/hearbeat_resp", (packet)=>{
                    self.RecvHeartbeat(packet, "UDP");
                });

                return res();
            });
            self.sockets['UDP'].on("message", (msg, rInfo)=>{
            
                self.OnData(msg, "UDP");
            });

        })   
    }

    AttemptReconnect(conType){
        var self = this;
        setTimeout(()=>{
            switch(conType){
                case "TCP":
                    self.EnableTCP(self.sockets['TCP'].server.ip, self.sockets['TCP'].server.port);
                break;

                case "UDP":
                    self.EnableUDP(self.sockets['UDP'].server.ip, self.sockets['UDP'].server.port);
                break;
            }
        },1000);
    }
    

    RecvHeartbeat(packet, conType) {
        let timestamp = parseInt(packet.data[0]);
        let con = this.sockets[conType];
        if(!con){
            return;
        }
    
        con.heartbeat.lastPacket = new Date().getTime();
        con.heartbeat.failed = 0;
        con.heartbeat.active = true;
        con.heartbeat.ping =  new Date().getTime() - timestamp;
    }

    CheckHeartbeat(conType){
        let con = this.sockets[conType];
        if(!con.heartbeat){
            console.log(con);
            
            
            return;
        }
        
        if(con.heartbeat.active == false){
            return;
        }

        let delaySinceLast = new Date().getTime() - con.heartbeat.lastPacket;
        if(delaySinceLast > this.heartbeatFreq){
            
            con.heartbeat.failed++;
            if( con.heartbeat.failed > this.heartbeatRetries){
                con.heartbeat.active = false;
                Logger.Warning("Client", `${conType}-TIMEOUT`, "Timedout! Reconnecting!")
                this.AttemptReconnect(conType);
            }
        }else{
            con.heartbeat.failed == 0;
        }
    }

    SendPacket(type, path, data, conType){
        if(!conType){
            conType = this.defaultConType;
        }
        var packetString_ = Util.buildPacket( type, path, data);
        if(this.verbose){
            Logger.Info(`Client-${this.id}`, "SendPacket", "Sending Packet: " + packetString_)
        }
        switch(conType){
            case "TCP":
                this.sockets['TCP'].write(packetString_)
            break;
            case "UDP":
                this.sockets['UDP'].send(packetString_,this.sockets['UDP'].server.port, this.sockets['UDP'].ip);
            break;
        }
    }

    // Events
    OnData(rawData, connection){
        var dataString_ = rawData.toString();
        var dataPackets_ = Util.parse(dataString_);

        for(var i=0;i<dataPackets_.length;i++){
            var dataPacket_ = dataPackets_[i];
            dataPacket_.connection = connection;
            if(this.verbose){
                Logger.Info("Client-"+this.id, "OnData", "Got DataPacket: " + JSON.stringify(dataPacket_));
            }
        
            
            switch(dataPacket_.type){
                case Consts.types.SUBMIT:
                    this.OnSubmit(dataPacket_);
                break;
                case Consts.types.COMMAND:
                    this.GetCommandReg(dataPacket_);
                    break;
                    
            }
        }
    }

    OnSubmit(packet){
        this.topics[packet.path] = packet.data;
        if(this.requestQueue[packet.path] && this.requestQueue[packet.path].status == "waiting"){
            this.requestQueue[packet.path].callback(packet);
            delete this.requestQueue[packet.path];
        }
        this.GetSubscription(packet);
    }
    
    // Functions

    NewTopic(name, path, protocol){
        if(this.verbose){
            Logger.Info("Client-"+this.id, "NewTopic", `Creating new topic ${name} at ${path} using ${protocol}`)
        }
        this.CallCommand( "server/new_topic", [name, path, protocol]);
        
    }

    GetTopic(path, cb){
        if(this.verbose){
            Logger.Info("Client-"+this.id, "GetTopic", `Getting topic ${path}`)
        }
        this.requestQueue[path] = {status: "waiting", callback: cb};
        this.SendPacket(Consts.types.REQUEST, path, []);
    }

    SetTopic(path, value){
        if(this.verbose){
            Logger.Info("Client-"+this.id, "SetTopic", `Seting ${path} to ${value}`)
        }
        this.SendPacket(Consts.types.SUBMIT, path, [value])
    }

    Subscribe(path, callback){
        if(this.verbose){
                Logger.Info("Client-"+this.id, "Subscribe", `Subscribing to path ${path}`)
        }
        this.CallCommand("server/subscribe", [path]);
      
        this.subscriptions.push({path: path, callback: callback});
    }
    CallCommand(path,data){
        if(this.verbose){
            Logger.Info("Client-"+this.id, "CallCommand", `Calling command ${path}`)
        }
        this.SendPacket(Consts.types.COMMAND, path,data);
    }
    RegisterCommand(path, callback){
        if(this.verbose){
                Logger.Info("Client-"+this.id, "RegisterCommand", `Registering command ${path}`)
        }
        this.SendPacket(Consts.types.COMMAND, "server/command", [path]);
        this.commands.push({path: path, callback: callback});
    }

    GetCommandReg(update){
        for (let i = 0; i < this.commands.length; i++) {
            const commandReg = this.commands[i];
           
            if(update.path.startsWith(commandReg.path)){
                commandReg.callback(update);
            }
        }
    }

    GetSubscription(update){
       
        for (let i = 0; i < this.subscriptions.length; i++) {
            const _sub = this.subscriptions[i];
           
            if(update.path.startsWith(_sub.path)){
                _sub.callback(update);
                
            }
        }
    }
}

module.exports = Client;
