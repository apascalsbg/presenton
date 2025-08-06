#!/bin/bash

echo "Starting production server..."

ollama serve &
service nginx start
service redis-server start
node /app/start.js
