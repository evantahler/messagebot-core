#!/usr/bin/env bash

cd "$(dirname "$0")"
cd ../..
mkdir -p ./tmp/maxmind
cd ./tmp/maxmind
wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz
gunzip GeoLiteCity.dat.gz -f
