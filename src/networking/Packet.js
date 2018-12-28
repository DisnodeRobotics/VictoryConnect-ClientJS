const Consts = require("../util/Consts");

class Packet{
    constructor(type, path, data){
        this.type = type;
        this.path = path;
        this.data = data;

        this.protocol = "DEFAULT";
        this.raw      = "";
    }

    setProtocol(protocol){
        this.protocol = protocol;
        return this;
    }

    setRaw(raw){
        this.raw = raw;
        return this;
    }

    toString(){
        if(Array.isArray(this.data) == false){
            this.data = [this.data];
        }
        return `${this.type} ${this.path} {${this.data.join(";")}}~`;
    }

    isValid(){
        return this.type != NaN && this.path;
    }


}

module.exports = Packet;
module.exports.DataType = {
    ERROR : -1, // Disconnects
    SUBMIT : 0, // Sending Data
    REQUEST : 1, // Requesting Data. Usually from server
    COMMAND: 2
};