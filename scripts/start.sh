#!/usr/bin/env bash

# Exit script as soon as a command fails.
set - o ipfs shutdown kill

echo "Running: "$0

mongod --logpath /dev/null &
jsipfs daemon &
sleep 5 &
node ./scripts/start.js
