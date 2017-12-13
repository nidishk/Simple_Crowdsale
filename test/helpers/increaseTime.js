// Returns the time of the last mined block in seconds
export default function increaseTime(time) {
  return web3.currentProvider.sendAsync({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [time], // 86400 seconds in a day
          id: new Date().getTime()},
          () => {}
        );
}
