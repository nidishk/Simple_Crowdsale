#!/usr/bin/env bash

# Based on https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/scripts/test.sh

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the testrpc instance that we started (if we started one and if it's still running).
  if [ -n "$testrpc_pid" ] && ps -p $testrpc_pid > /dev/null; then
    kill -9 $testrpc_pid
  fi
}

testrpc_running() {
  nc -z localhost 9000
}

if testrpc_running; then
  echo "Using existing testrpc instance"
else
  echo "Starting our own testrpc instance"
  testrpc \
  -p \
  9000 \
  > /dev/null &
  testrpc_pid=$!
fi

node_modules/.bin/truffle test "$@"
