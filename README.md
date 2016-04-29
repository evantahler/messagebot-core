# MessageBot.io
*A modern customer relationship and analytics platform*

[![Build Status](https://travis-ci.org/messagebot/messagebot-core.svg)](https://travis-ci.org/messagebot/messagebot-core)

## Requirements

- Node.js
- mySQL
- Redis
- ElasticSearch

## Install

- `npm install`

## Configuration and Running

`source .env && npm run migrate && npm start`

- start `redis`
- start `mySQL`
- start `elasticsearch`
- Configure `.env` with the secrets you need, or ensure that they are already present within the environment
  - ensure that the databases you listed exist and that the user(s) you have configured can reach & access them
- npm install && npm update
- run migrations (elasticsearch, mysql, and even maxmind) via `npm run migrate`
- (source .env && ) `npm start`
