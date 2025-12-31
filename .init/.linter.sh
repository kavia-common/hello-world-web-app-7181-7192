#!/bin/bash
cd /home/kavia/workspace/code-generation/hello-world-web-app-7181-7192/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

