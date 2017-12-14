import latestTime from './latestTime'

// Increases testrpc time by the passed duration in seconds
export default function increaseTime(time) {
  return web3.currentProvider.sendAsync({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [time], // 86400 seconds in a day
          id: new Date().getTime()},
          () => {}
        );
}

/**
 * Beware that due to the need of calling two separate testrpc methods and rpc calls overhead
 * it's hard to increase time precisely to a target point so design your test to tolerate
 * small fluctuations from time to time.
 *
 * @param target time in seconds
 */
export function increaseTimeTo(target) {
  let now = latestTime();
  if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
  let diff = target - now;
  return increaseTime(diff);
}

export const duration = {
  seconds: function(val) { return val},
  minutes: function(val) { return val * this.seconds(60) },
  hours:   function(val) { return val * this.minutes(60) },
  days:    function(val) { return val * this.hours(24) },
  weeks:   function(val) { return val * this.days(7) },
  years:   function(val) { return val * this.days(365)}
};
