FROM alpine:3.3
MAINTAINER admin@messagebot.io

RUN apk add --update bash wget nodejs git python make g++

RUN mkdir -p /app
WORKDIR /app
COPY package.json /app/package.json
RUN npm install
COPY . /app

RUN echo '{ "allow_root": true }' > /root/.bowerrc

# RUN npm run migrate

CMD ["node", "./node_modules/.bin/actionhero", "start"]
EXPOSE 8080 5000
