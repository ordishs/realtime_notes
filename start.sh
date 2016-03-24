#!/bin/bash

npm install --production
NODE_ENV=production nohup node server.js &
