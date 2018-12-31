const Logger = require("disnode-logger");
const Net = require("net");
const PacketParser = require("../util/PacketParser");
const Consts = require("../util/Consts");
const Packet = require("./Packet");
const EventEmitter = require('events');
class TCPConnection extends EventEmitter {
    constructor(serverIP, serverPort) {
        super();
        this.serverIP = serverIP;   // IP of the VC server 
        this.serverPort = serverPort; // Port for the TCP socket on the VC Server
        this.socket = null; // TCP Socket Object
        this.reconnectTime = 1500;        // How long to wait inbetween reconnect attempts
        this.reconnectAttempt = 0;          // How many times have we tried to reconnect
        this.isReconnecting = false;      // Are we currently trying to reconnect
        this.isConnected = false;
        this.currentPing  = -1;


        Logger.Info("TCPConnection", "constructor", `New TCPConnection constructed. ServerIP: ${serverIP} ServerPort: ${serverPort}`);
    }


    connect() {
        Logger.Info("TCPConnection", "connect", `Connecting to ${this.serverIP}:${this.serverPort}`);
        if (this.isConnected) {
            Logger.Info("TCPConnection", "connect", `Already connected. Disconnecting first.`);
            this.disconnect();
        }
        this.socket = new Net.Socket();

        this.socket.on("error", (err) => { this.onError(err) });
        this.startListening();
        var self = this;
        this.socket.connect(this.serverPort, this.serverIP, () => {
            Logger.Success("TCPConnection", "connect", "Connected to VC TCP Server Socket!");
            self.emit("connected");
        });
    }

    attemptReconnect() {
        this.disconnect();
        this.isReconnecting = true;
        Logger.Info("TCPConnection", "attemptReconnect", "Attempting reconnect with delay of : " + this.reconnectTime);
        var self = this;
        setTimeout(() => {
            self.connect();
        }, this.reconnectTime)

    }

    disconnect() {
        if (this.socket) {
            this.socket.destroy();
        }
        this.isConnected = false;
    }

    startListening() {
        var self = this;
        this.currentPacket = "";

        this.socket.on("data", (rawData) => {
           
            
            var dataString = rawData.toString();
         
            self.currentPacket += dataString;

            if (self.currentPacket.indexOf("~") != -1) {
                
                var packets = PacketParser.parse( self.currentPacket);
                for (var i = 0; i < packets.length; i++) {
                    self.emit("packet", packets[i]);
                }
                self.currentPacket = "";
            }else{
                console.log("INCOMPLETE PACKET");
            }

        });
    }


    onError(err) {
        Logger.Error("TCPConnection", "onError", `TCP Error: ${err}`)
        this.attemptReconnect();
    }

    onWelcomed(interval) {
        var self = this;
        self.isConnected = true;
        self.isReconnecting = false;
        Logger.Info("TCPConnection", "startHeartbeat", `Starting HB with interval: ${interval}`)
        const hbInterval = setInterval(() => {
            if (!self.isConnected) {
                Logger.Warning("TCPConnection", "startHeartbeat", `Stopping Hearbeat due to isConnected=false`)
                clearInterval(hbInterval);
            }

            self.sendPacket(new Packet(Consts.packetTypes.COMMAND, "server/heartbeat", [new Date().getTime(), self.currentPing]));
        }, interval);
    }
    recvHeartbeat(timestamp){
        timestamp = parseInt(timestamp);
        this.currentPing = new Date().getTime() - timestamp;
    }
    sendPacket(packet) {
      
        
        if (!this.socket) {
            return;
        }

        var stringPacket = packet.toString();
        this.socket.write(stringPacket);
      
    }


}

module.exports = TCPConnection;