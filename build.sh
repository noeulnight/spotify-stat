#!/bin/sh

docker build -f Dockerfile.client.production . -t noeulnight/spotify-stat-client:latest
docker build -f Dockerfile.server.production . -t noeulnight/spotify-stat-server:latest
