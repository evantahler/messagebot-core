# MessageBot.io
*A modern customer relationship and analytics platform*

[![Build Status](https://travis-ci.org/messagebot/messagebot-core.svg)](https://travis-ci.org/messagebot/messagebot-core)

## Requirements

- Node.js
- MySQL/Postgres
- Redis
- ElasticSearch

## Install

- `npm run prepare`

## Configuration and Running

- start `redis`
- start `mySQL`
- start `elasticsearch`
- Configure `.env` with the secrets you need, or ensure that they are already present within the environment
  - ensure that the databases you listed exist and that the user(s) you have configured can reach & access them

`source .env && npm run migrate && npm start`
