# MessageBot.io
*A modern customer relationship and analytics platform*

[![CircleCI](https://circleci.com/gh/messagebot/messagebot-core.svg?style=svg&circle-token=3a97ce7226e8a46bd8b5f8b313ffcebf95b92e09)](https://circleci.com/gh/messagebot/messagebot-core)

## Requirements

| Software          | Version   |
|-------------------|-----------|
| Node.JS           | >=4.0.0   |
| ElasticSearch     | >=2.0.0   |
| Redis             | >=2.0.0   |
| MySQL or Postgres | "modern"  |

## Install

- `npm install`
  - this will also run `npm run prepare`, installing needed geolocation databases, kibana, etc
- `cp .env.example .env`, and adjust according to your system/needs

## Configuration and Running

- Start `redis`
- Start `elasticsearch`
- Start your relational database, IE: `mySQL`
  - be sure to create the database you need for development, IE:
    - (mysql) `mysql -u root -e "crete database messagebot_development"`
    - (postgres) `createdb messagebot_development`
  - Install any additional database drivers needed for your relational database:
    - `npm install --save pg pg-hstore`
    - `npm install --save mysql`
    - etc
- Configure `.env` with the secrets you need, or ensure that they are already present within the environment
  - ensure that the databases you listed exist and that the user(s) you have configured can reach & access them
- Source your environment, ie: `source .env`
- Create the First Team from the CLI:
  - `./bin/messagebot team create --name MessageBot --trackingDomainRegexp "^.*$" --trackingDomain "tracking.myapp.com"`
  - This will also create the first admin user for this team.  Take note of this user's email and password.
- Start the App: `npm run migrate && npm start`

## Migration Options

Run `npm run migrate` to migrate all databases (relational and ElasticSearch).
`npm run migrate` is a composition of `npm run migrate:sequelize` and `npm run migrate:elasticsearh`, which you can also run separately if desired.

ElasticSearch migrations can be effected via a few environment variables, available for inspection at `db/ElasticSearch/indexes`:

- `NUMBER_OF_SHARDS` (default: `10`)
- `NUMBER_OF_REPLICAS` (default: `0`)
- `GEOHASH_PRECISION` (default: `1km`)

There are no options available for the relational database, other than connection options.  Migration files are available for inspection at `db/sequelize/migrations`

ElasticSearch Migrations will also be run automatically via the MessageBot application every night to ensure that the monthly database are created.

## Faker

To generate seed data, you can run 2 faker commands:

- `npm run faker:seed` will generate `process.env.USERS_COUNT || 1000` users who follow the funnel between now and 30 days ago.
- `npm run faker:run` will start generating fake users and events now, creating a new one every `parseInt(process.env.SLEEP) || (1000 * 2.2)`ms

Both faker commands follow a funnel designed to emulate a simple e-commerce applications conversion funnel.  Reaching the final `thank you` page will also genearte a purchase event.
```js
exports.funnel = [
  { pages: ['index.html'],                                                rate: 1.00 },
  { pages: ['about.html', 'learn_more.html'],                             rate: 0.50 },
  { pages: ['signup.html', 'log-in.html'],                                rate: 0.50 },
  { pages: ['cool-hat.html', 'aweseome-shoes.html', 'ugly-sweater.html'], rate: 0.30 },
  { pages: ['cart.html'],                                                 rate: 0.50 },
  { pages: ['checkout.html'],                                             rate: 0.50 },
  { pages: ['thank-you.html'],                                            rate: 0.99 },
];
```

Users will be assigned one of the following sources at random:
```js
exports.sources = ['web', 'iphone', 'android', 'referral'];
```

The funnel and sources can be modified via `db/fakers/common.js`

## CLI

The MessageBot CLI is used to manage system-level data, IE: the creation and removal of teams.  You can learn more about the CLI by running `./bin/messsagebot help`

## Testing

`npm test` should prepare and run everything you need, including the creation and seeding of both your ElasticsSearch and Relational database.  Ensure that the environment and various config files are prepared correctly.

**Notes**
- At this time, the test suite will only run on MySQL or Postgres, and assumes the test databases are local (on the same host) as where you are running the test suite code.
- The test suite will configure a new redis database to be used equal to your normal database ID + 1

## Notes

This product includes GeoLite2 data created by MaxMind, available from [www.maxmind.com](http://www.maxmind.com).
