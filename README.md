# karura-dadhboard
A JavaScript NodeJS app that is scheulde to call the Karura and Kusama block chains every 6 seconds to gather information on Total Value Locked in all DEX Pools (Karura), Stablecoins (Karura) and Crowdloans (Kusama).

## 📝 Features
- [x] Call Karura and Kusama for TVL data
- [x] Store data in a DB
- [ ] Deploy solution to EC2 instance

## ▶️ Running
- Clone repo `git clone git@github.com:AcalaNetwork/karura-dashboard.git`
- Install NPM modules run `yarn`
- Run `yarn start`

## Future changes before deployment
- Move database to a timeseries drivien DB like InfluxDB
- Convert server to TypeScript
- Implement and increase unit/integration test coverage
- Deploy to EC2 instance
- Render results in some form of UI
- Expand data points collected and value of the analytics
