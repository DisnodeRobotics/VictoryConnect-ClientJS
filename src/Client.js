const TCPConnection = require("./networking/TCPConnection");

var tcpCon = new TCPConnection("127.0.0.1", 5000);
tcpCon.connect();