module.exports = {
  packetTypes:{
    ERROR : -1, // Disconnects
    SUBMIT : 0, // Sending Data
    REQUEST : 1, // Requesting Data. Usually from server
    COMMAND: 2
  }
};
