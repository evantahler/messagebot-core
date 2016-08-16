FROM alpine:3.3
MAINTAINER admin@messagebot.io

RUN apk add --update bash wget curl nodejs git python make gzip g++

RUN mkdir -p /app
WORKDIR /app

RUN echo '{ "allow_root": true }' > /root/.bowerrc

COPY . /app
RUN rm -rf /app/.env
RUN rm -rf /app/tmp
RUN rm -rf /app/node_modules
RUN rm -rf /app/public/bower_components
RUN npm install
RUN npm run prepare

CMD ["node", "./node_modules/.bin/actionhero", "start"]
EXPOSE 8080 5000
