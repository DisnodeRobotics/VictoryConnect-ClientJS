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

        this.requestQueue = {};

        if(verbose){
            Logger.Info("Client-"+this.id, "constructor", `Creating new client "${this.name}" with id ${this.id}`);
        }
    
    }

    SetDefaultConnectionType(conType){
        this.defaultConType = conType;
    }

    EnableTCP(ip="127.0.0.1", port=4056){
        var self = this;
        return new Promise((res,rej)=>{
            this.sockets['TCP'] = net.createConnection(port, ip, ()=>{
                if(self.verbose){
                    Logger.Success("Client-"+this.id, "EnableTCP", "Connected to server‽‽‽")
                }
                this.sockets['TCP'].on("connection", ()=>{

                });
                this.sockets['TCP'].on("data", (data)=>{
                    self.OnData(data, "TCP");
                });
                self.SendPacket( Consts.types.COMMAND, "server/register", [self.id, self.name], "TCP");

                setInterval(()=>{
                    self.SendPacket( Consts.types.COMMAND, "server/heartbeat", [new Date().getTime()], "TCP");
                }, 250);
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
            self.sockets['UDP'].bind();
            self.sockets['UDP'].on("listening", ()=>{
                if(self.verbose){
                    Logger.Success("Client-"+this.id, "EnableUDP", "UDP Listening")
                }
        
                self.SendPacket( Consts.types.COMMAND, "server/register", [self.id, self.name], "UDP");
                setInterval(()=>{
                    self.SendPacket( Consts.types.COMMAND, "server/heartbeat", [new Date().getTime()], "UDP");
                }, 250);
                return res();
            });
            self.sockets['UDP'].on("message", (msg, rInfo)=>{
            
                self.OnData(msg, "UDP");
            });

        })   
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
