#!/usr/bin/env bash

if [ "${OSTYPE//[0-9.]/}" == "darwin" ]
then
  VERSION="kibana-4.5.1-darwin-x64"
else
  VERSION="kibana-4.5.1-linux-x64"
fi

cd "$(dirname "$0")"
cd ..
mkdir -p ./tmp/kibana
cd ./tmp/kibana

condition=$(which wget 2>/dev/null | grep -v "not found" | wc -l)
if [ $condition -eq 0 ] ; then
    echo "wget is not installed"
    exit 1
fi

if [ -f "$VERSION/package.json" ]; then
  echo "Kibana downloaded"
else
  wget "https://download.elastic.co/kibana/kibana/$VERSION.tar.gz"
  tar -xvf $VERSION.tar.gz
fi

./$VERSION/bin/kibana
