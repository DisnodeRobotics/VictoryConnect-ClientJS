module.exports = {
  types:{
    ERROR : -1, // Disconnects
    SUBMIT : 0, // Sending Data
    REQUEST : 1, // Requesting Data. Usually from server
  },
  connnection:{
    DEFAULT_IP: "127.0.0.1",
    DEFAULT_PORT: "5800",
    RECONNECT_TIME: 3000
  }
};
