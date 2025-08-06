#!/bin/bash

echo "Starting development server..."

if [ -d "/node_dependencies/node_modules" ]; then
  rm -rf /app/servers/nextjs/node_modules
  mv /node_dependencies/node_modules /app/servers/nextjs
fi

ollama serve &
service nginx start
service redis-server start
node /app/start.js
