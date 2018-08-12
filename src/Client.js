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
        this.id = id + "-"+UID(2);
        this.name = name;
        this.sockets = {};
        this.verbose = verbose;

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
                    self.OnData(data);
                });
                self.SendPacket("TCP", Consts.types.COMMAND, "register", [self.id, self.name]);
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
                self.SendPacket("UDP", Consts.types.COMMAND, "register", [self.id, self.name]);
                return res();
            });
            self.sockets['UDP'].on("message", (msg, rInfo)=>{
                self.OnData(msg);
            })

        })   
    }

    SendPacket(conType, type, path, data){
        
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
    OnData(rawData){
        var dataString_ = rawData.toString();
        var dataPacket_ = Util.parse(dataString_);

        if(this.verbose){
            Logger.Info("Client-"+this.id, "OnData", "Got DataPacket: " + JSON.stringify(dataPacket_));
        }
    }
    
    // Functions

    NewTopic(name, path, protocol){
        if(this.verbose){
            Logger.Info("Client-"+this.id, "NewTopic", `Creating new topic ${name} at ${path} using ${protocol}`)
        }
        this.SendPacket(this.defaultConType, Consts.types.COMMAND, "new_topic", [name, path, protocol]);
    }

    GetTopic(){

    }

    SetTopic(){

    }

    Subscribe(){

    }




}

module.exports = Client;
