const TCPConnection = require("./networking/TCPConnection");
const UDPConnection = require("./networking/UDPConnection")
const Packet = require("./networking/Packet");
const Consts = require("./util/Consts");
const Logger = require("disnode-logger");
const EventEmitter = require('events');
const mDNS = require("mdns-js");
class Client extends EventEmitter {
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
        this.tickRate = 100;

        Logger.Info("Client", "constructor", `Client created id ${this.id} name ${this.name}`)

        var self = this;
        self.registerCommand("server/welcome", (packet) => {
            var conType = packet.data[0];
            var hbInterval = packet.data[1];

            Logger.Success("Client", "server/welcome", "Server welcome! H/B interval for " + conType + " = " + hbInterval);

            if (!self.connections[conType]) {
                Logger.Error("Client", "server/welcome", "Server welcomed a connection that did not exist: " + conType);
                return;
            }

            self.connections[conType].onWelcomed(hbInterval);

            self.emit("ready", conType);
        });
        
        self.registerCommand("server/hearbeat_resp", (packet) => {
            var timestamp = packet.data[0];
            var conType  = packet.data[1];

        
            if (!self.connections[conType]) {
                Logger.Error("Client", "server/hearbeat_resp", "Server welcomed a connection that did not exist: " + conType);
                return;
            }

            self.connections[conType].recvHeartbeat(timestamp);
        });


        this.startTickLoop();
    }

    useMDNS(tcpCb, updCb) {
        var tcpBrowser = mDNS.createBrowser(mDNS.tcp('vc-server'));
        var udpBrowser = mDNS.createBrowser(mDNS.udp('vc-server'));

        Logger.Info("Client", "useMDNS", "Waiting for VC-SERVER services on mDNS");


        tcpBrowser.on('ready', function onReady() {
            Logger.Info("Client", "TCP-MDNS", "Listening for TCP services");
            tcpBrowser.discover();
        });


        tcpBrowser.on('update', function onUpdate(data) {
            var type = data.type[0].name;
          
            var address = data.addresses[0];
            var port = data.port;
            var protocol = data.type[0].protocol;
            if(type == "vc-server" && protocol == "tcp"){
                Logger.Success("Client", "TCP-MDNS", `Found TCP Service @ ${address}:${port}`);
                tcpCb(address, port);
            }
        });

           
        udpBrowser.on('ready', function onReady() {
            Logger.Info("Client", "UDP-MDNS", "Listening for UDP services");
            udpBrowser.discover();
        });


        udpBrowser.on('update', function onUpdate(data) {
            var type = data.type[0].name;
         
            var address = data.addresses[0];
            var port = data.port;
            var protocol = data.type[0].protocol;
            if(type == "vc-server" && protocol == "udp"){
                Logger.Success("Client", "UDP-MDNS", `Found UDP Service @ ${address}:${port}`);
                updCb(address, port);
            }
        });
    }

    enableTCP(ip, port) {
        var self = this;
        var tcpCon = new TCPConnection(ip, port);
        tcpCon.on("packet", (packet) => {
            self.onPacket(packet);
        });
        tcpCon.on("connected", () => {
            self.connections["TCP"] = tcpCon;
            self.sendPacket("TCP", new Packet(Consts.packetTypes.COMMAND, "server/register", [self.id, self.name]))
        })
        tcpCon.connect();


    }

    enableUDP(ip, port) {
        var self = this;
        var udpCon = new UDPConnection(ip, port);
        udpCon.on("packet", (packet) => {
            self.onPacket(packet);
        });
        udpCon.on("connected", () => {
           
            self.connections["UDP"] = udpCon;
            self.sendPacket("UDP", new Packet(Consts.packetTypes.COMMAND, "server/register", [self.id, self.name]))
            
        })
        udpCon.connect();


    }

    setDefaultConnection(conType) {
        this.defaultConnection = conType;
    }

    setASAP(asapVal) {
        this.isASAP = asapVal;
    }

    sendPacket(protocol, packet) {
        packet.setProtocol(protocol);
        this.packetQueue.push(packet);
        if (this.isASAP) {
            this.sendQueue();
        }
    }



    sendQueue() {
        for (let i = 0; i < this.packetQueue.length; i++) {
            const packet = this.packetQueue[i];
            const conType = packet.protocol;

            var connection = null;

            if (this.connections[conType]) {
                connection = this.connections[conType];
            } else {
                connection = this.connections[Object.keys(this.connections)[0]];
            }

            if (connection) {
                connection.sendPacket(packet);
  
                
                this.packetQueue.splice(i, 1);
            }else{
               
            }

        }
    }

    onPacket(packet) {

        const type = packet.type;
        switch (type) {
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

    onErrorPacket(errorPacket) {
        Logger.Error("Client", "onErrorPacket", errorPacket.path + " - " + errorPacket.data);
        this.emit("error", errorPacket);
    }

    onCommandPacket(commandPacket) {
        if (!this.commandListeners[commandPacket.path]) {


            return;
        }

        if (this.commandListeners[commandPacket.path].length == 0) {

            return;
        }

        var listeners = this.commandListeners[commandPacket.path];
        for (var i = 0; i < listeners.length; i++) {
            listeners[i](commandPacket);

        }
    }


    onSubmitPacket(submitPacket) {
        for (let i = 0; i < this.subscribeListeners.length; i++) {
            const _sub = this.subscribeListeners[i];

            if (submitPacket.path.startsWith(_sub.path) || _sub.path == "*") {
                _sub.cb(submitPacket)
            }
        }

    }

    newTopic(name, path, protocol) {
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, "server/new_topic", [name, path, protocol]));
    }

    setTopic(path, value) {
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.SUBMIT, path, value));
    }

    subscribe(path, cb) {

        this.subscribeListeners.push({
            path: path,
            cb: cb
        });
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, "server/subscribe", [path]));
    }

    registerCommand(path, cb) {
        if (this.commandListeners[path] == null) {
            this.commandListeners[path] = [];
        }

        this.commandListeners[path].push(cb);
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, "server/command", [path]));
    }

    callCommand(path, value) {
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, path, value));
    }

    addSource(path, connection, cb) {
        this.newTopic("Source " + path, path, connection);
        this.topicSources.push({
            path: path,
            connection: connection,
            cb: cb
        });
    }

    setTickRate(tickRate) {
        this.sendPacket(this.defaultConnection, new Packet(Packet.DataType.COMMAND, "server/tickrate", [tickRate]));
        this.tickRate = tickRate;
        this.resetTickLoop();
    }

    startTickLoop() {
        var self = this;
        this.tickRateInterval = setInterval(() => {
            self.onTick();
        });
    }

    onTick() {
        this.sendTopicSources();
        this.sendQueue();
    }

    sendTopicSources() {
        for (let i = 0; i < this.topicSources.length; i++) {
            const source = this.topicSources[i];
            this.sendPacket(source.connection, new Packet(Packet.DataType.SUBMIT, source.path, source.cb()));
        }
    }

    resetTickLoop() {
        clearInterval(this.tickRateInterval);
        this.startTickLoop();
    }


}


module.exports = Client;