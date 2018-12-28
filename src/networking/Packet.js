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
        return `${type} ${path} {${data.join(";")}}~`;
    }

    
}