const Logger = require('disnode-logger')
const EventEmitter = require('events');
const Util = require("../Util");
let info = {
    server: {
        ip: "127.0.0.1",
        port: "5000"
    },
    heartbeat: {},
    status: {
        ready: false, //Client has the nessary infomration, can be started
        active: false, // Client is running and is connected
        stable: false, // Client is recieving regular heartbeats and has low ping
        ping: 0 // Current Client Ping
    },
    config: {},
    stats: {},
    socket: null
};

let messageQueue = {

};

let type = "TCP";
let events = new EventEmitter();

module.exports.type = type;
module.exports.info = info;
module.exports.messageQueue = messageQueue;
module.exports.events = events;

// Server Connection Functions

module.exports.Init = (serverInfo, config) => {
    let self = this;

    return new Promise((resolve, reject) => {
        //Set Info based on Params
        info.server = serverInfo;
        info.config = config;

        info.stataus.ready = true; // Mark connection as ready.

        if (info.config.verbose) Logger.Info("TCPConnection", "Init", "TCP Client configured!");
        events.emit("configured");
        return resolve();
    });
};

//Connect to the server using Init Info
module.exports.Connect = () => {
    var self = this;

    return new Promise((resolve, reject)=>{

        if( !info.status.ready){
            return reject("Server not ready");
        }

        info.socket = net.createConnection(info.server.port, info.server.ip, ()=>{

            info.socket.on("connection", ()=>{
                if(info.config.verbose){
                    Logger.Success("Client-"+this.id, "EnableTCP", "Connected to server‽‽‽")
                }
                events.emit("connected");
            });

            info.socket.on("data", (data)=>{
                events.emit("data", data.toString());
            });

            info.socket.on("error", (data)=>{
                Logger.Error("Client", "TCP-ERROR", data);
                events.emit("error", data);
            });
            /*
            self.SendPacket( Consts.types.COMMAND, "server/register", [self.id, self.name], "TCP");

            setInterval(()=>{
                self.SendPacket( Consts.types.COMMAND, "server/heartbeat", [new Date().getTime()], "TCP");
                self.CheckHeartbeat("TCP");
            }, 250);

            self.RegisterCommand("server/heartbeat_resp", (packet)=>{
                self.RecvHeartbeat(packet, "TCP");
            });
            8*/
            return res();
        });
    });
}

module.exports.Reconnect = () => {

}

module.exports.Disconnect = () => {
    info.status.active = false;
}

module.exports.SendPacket = (type, path, data) => {
    var self = this;

    return new Promise((resolve, reject)=>{

        //Check is the server is alive to send packets
        if(!info.status.active || !info.status.ready){
            return reject("Server not active and/or ready");
        }

        let sendString = Util.buildPacket(type, path, data);

        info.socket.write(sendString);

        return resolve(sendString);
    });
}

module.exports.OnHearbeat = (packet) => {

}

module.exports.CheckHeartbeat = () => {

}

module.exports.SendHeartbeat = () => {

}

module.exports.OnNetworkUnreliable = () =>{

}