const Logger = require("disnode-logger");
const Net    = require("net");

class TCPConnection{
    constructor(serverIP, serverPort, client){
        this.serverIP         = serverIP;   // IP of the VC server 
        this.serverPort       = serverPort; // Port for the TCP socket on the VC Server
        this.parent           = client;     // Parent client class
        this.socket           = null; // TCP Socket Object
        this.reconnectTime    = 1500;        // How long to wait inbetween reconnect attempts
        this.reconnectAttempt = 0;          // How many times have we tried to reconnect
        this.isReconnecting   = false;      // Are we currently trying to reconnect
        this.isConnected      = false;

    
        Logger.Info("TCPConnection", "constructor", `New TCPConnection constructed. ServerIP: ${serverIP} ServerPort: ${serverPort}`);
    }

    connect(){
        Logger.Info("TCPConnection", "connect", `Connecting to ${this.serverIP}:${this.serverPort}`);
        if(this.isConnected){
            Logger.Info("TCPConnection", "connect", `Already connected. Disconnecting first.`);
            this.disconnect();
        }
        this.socket           = new Net.Socket();
        this.socket.on("error", (err)=>{ this.onError(err)});
        this.socket.connect(this.serverPort, this.serverIP, ()=>{
            Logger.Success("TCPConnection", "connect", "Connected to VC TCP Server Socket!");
            this.isConnected = true;
            this.isReconnecting = false;
            this.startListening();
        });
    }

    attemptReconnect(){

        this.disconnect();
        this.isReconnecting = true;
        Logger.Info("TCPConnection", "attemptReconnect", "Attempting reconnect with delay of : " + this.reconnectTime);
        var self = this;
        setTimeout(()=>{
            self.connect();
        }, this.reconnectTime)
      

    }

    disconnect(){
        if(this.socket){
            this.socket.destroy();
        }
        this.isConnected = false;
    }

    startListening(){
        this.socket.on("data", this.onData);
      
    }

    onData(data){

    }

    onClose(){
        
    }

    onError(err){
        Logger.Warning("TCPConnection", "onError", `TCP Error: ${err}`)
        this.attemptReconnect();
    }

    startHeartbeat(){

    }

    sendPacket(){

    }


}

module.exports = TCPConnection;