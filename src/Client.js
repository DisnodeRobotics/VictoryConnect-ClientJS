const TCPConnection = require("./networking/TCPConnection");
const Packet        = require("./networking/Packet");
const Consts        = require("./util/Consts");
const Logger        = require("disnode-logger");
const EventEmitter = require( 'events' );
class Client extends EventEmitter{
    constructor(id, name) {
        super();
        this.id = id;
        this.name = name;
        this.connections = {};
        this.commandListeners = {};
        this.subscribeListeners = [];
        this.topicSources = [];
        this.defaultConnection = "TCP";
        this.packetQueue = [];
        this.isASAP = false;
        this.tickRate = 50;

        Logger.Info("Client", "constructor", `Client created id ${this.id} name ${this.name}`)

        var self = this;
        self.registerCommand("server/welcome", (packet)=>{
            var conType = packet.data[0];
            var hbInterval = packet.data[1];
            
          
          

            Logger.Success("Client", "server/welcome", "Server welcome! H/B interval for " + conType + " = " + hbInterval);

            if(!self.connections[conType]){
                Logger.Error("Client", "server/welcome","Server welcomed a connection that did not exist: " + conType);
                return;
            }

            self.connections[conType].startHeartbeat(hbInterval);

            self.emit("ready", conType);
        });
        
        this.startTickLoop();
    }

    enableTCP() {
        var self = this;
        var tcpCon = new TCPConnection("127.0.0.1", 5000);
        tcpCon.on("packet",(packet)=>{
            self.onPacket(packet);
        });
        tcpCon.on("connected",()=>{  console.log("CONNECTD!");
            
            self.sendPacket(self.defaultConnection,new Packet(Consts.packetTypes.COMMAND,"server/register",[self.id, self.name]))
            self.connections["TCP"] = tcpCon;
        })
        tcpCon.connect();

    
    }

    setDefaultConnection(conType){
        this.defaultConnection = conType;
    }

    setASAP(asapVal){
        this.isASAP = asapVal;
    }

    sendPacket(protocol, packet){
        packet.setProtocol(protocol);
        this.packetQueue.push(packet);
        if(this.isASAP){
            this.sendQueue();
        }
    }

 

    sendQueue(){
        for (let i = 0; i < this.packetQueue.length; i++) {
            const packet = this.packetQueue[i];
            const conType = packet.protocol;

            var connection = null;

            if(this.connections[conType]){
                connection = this.connections[conType];
            }else{
                connection = this.connections[Object.keys(this.connections)[0]];
            }

            if(connection){
                connection.sendPacket(packet);
               
                this.packetQueue.splice(i,1);

               
                
            }
            
        }
    }

    onPacket(packet){
       
        const type = packet.type;
        switch(type){
            case Consts.packetTypes.ERROR:
                this.onErrorPacket(packet);
            break;

            case Consts.packetTypes.SUBMIT:
                this.onSubmitPacket(packet);
            break;

            case Consts.packetTypes.REQUEST:
            break;

             case Consts.packetTypes.COMMAND:
                this.onCommandPacket(packet);
            break;
        }
    }

    onErrorPacket(errorPacket){
        Logger.Error("Client", "onErrorPacket", errorPacket.path + " - " + errorPacket.data);
        this.emit("error", errorPacket);
    }

    onCommandPacket(commandPacket){
        if(!this.commandListeners[commandPacket.path]){

            
            return;
        }

        if(this.commandListeners[commandPacket.path].length == 0){
          
            return;
        }

        var listeners = this.commandListeners[commandPacket.path];
        for(var i=0;i<listeners.length;i++){
            listeners[i](commandPacket);

        }
    }
    

    onSubmitPacket(submitPacket){
      for (let i = 0; i < this.subscribeListeners.length; i++) {
        const _sub = this.subscribeListeners[i];
        
        if(submitPacket.path.startsWith(_sub.path) || _sub.path == "*"){
            _sub.cb(submitPacket)
        }
    }
        
    }

    newTopic(name, path, protocol){
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, "server/new_topic", [name,path,protocol]));
    }

    setTopic(path, value){
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.SUBMIT, path, value));
    }

    subscribe(path, cb){

        this.subscribeListeners.push({
            path: path,
            cb: cb
        });
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, "server/subscribe",[path]));
    }

    registerCommand(path, cb){
        if(this.commandListeners[path] == null){
            this.commandListeners[path] = [];
        }

        this.commandListeners[path].push(cb);
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, "server/command",[path]));
    }

    callCommand(path, value){
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, path, value));
    }

    addSource(path, connection, cb){
        this.newTopic("Source " + path, path,connection);
        this.topicSources.push({
            path: path,
            connection: connection,
            cb: cb
        });
    }

    setTickRate(tickRate){
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, "server/tickrate",[tickRate]));
        this.tickRate = tickRate;
        this.resetTickLoop();
    }

    startTickLoop(){
        var self = this;
        this.tickRateInterval = setInterval(()=>{
            self.onTick();
        });
    }

    onTick(){
        this.sendTopicSources();
        this.sendQueue();
    }

    sendTopicSources(){
        for (let i = 0; i < this.topicSources.length; i++) {
            const source = this.topicSources[i];
            this.sendPacket(source.connection, new Packet(Packet.DataType.SUBMIT, source.path, source.cb()));
        }
    }

    resetTickLoop(){
        clearInterval(this.tickRateInterval);
        this.startTickLoop();
    }
    

}


module.exports = Client;