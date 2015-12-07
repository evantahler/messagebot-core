# MessageBot.io

[![Build Status](https://travis-ci.org/evantahler/messagebot.io.svg)](https://travis-ci.org/evantahler/messagebot.io)

MessageBot.io: A User Relationship Manager.

  - Manage all communication with your users:
    - On Site
    - Email
    - Push
  - Track all actions that your users take
    - Page Views
    - Events
    - Clicks
    - Opens
    - Purchases
    - Interests
  - Finally, get a wholistic view of your user’s behavior, all in one place with one tool
  - Oh, and its free!*

* we will be selling a hosted version, support, and custom development of enterprise features.  Stay Tuned.

## Requirements

- Node.js
- mySQL
- Redis
- ElasticSearch

## Configuration and Running

### Node Setup

- Configure `.env` with the secrets you need, or ensure that they are already present within the environment
  - ensure that the databases you listed exist and that the user(s) you have configured can reach & access them
- npm install && npm update
- run migrations via `npm run migrate`
- (source .env && ) `npm start`