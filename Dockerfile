FROM alpine:3.3
MAINTAINER admin@messagebot.io

RUN apk add --update bash wget curl nodejs git python make gzip g++

RUN mkdir -p /app
WORKDIR /app

COPY . /app

RUN npm install
RUN npm run ui:build
RUN npm prune --production

CMD ["node", "./node_modules/.bin/actionhero", "start"]
EXPOSE 8080 5000
