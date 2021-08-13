// const Scanner = require('@open-web3/scanner');
const { calculateBlockTvl } = require('./services/calculateBlockTvl');
const chalk = require('chalk');
const config = require("./config.json")
const { sleep } = require("./util/index")
const log = console.log;

const { MongoClient } = require('mongodb');
const client = new MongoClient(config.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const tvl = client.db("kusama-statistics").collection("total-value-locked");

(async function main() {
    log(chalk.blue.bold('Start Main Function'))
    let lastScanRecord;

    while(true) {
        try {
            await client.connect();
            lastScanRecord = await tvl.findOne({}, { sort:{ $natural:-1 } })
            
            await calculateBlockTvl(lastScanRecord);

            log(chalk.blue.bold(`Sleeping for ${config.SLEEP_DURATION / 1000} seconds...`))
            await sleep(config.SLEEP_DURATION);
        } catch (e) {
            console.error("Error getting last scan reccord", e);
        }  
    }
})()

// TODO: Implement event driven scanning using Acala Scanner
// Scanner package currently broken needs re-implemntation before continuing with block event driven logic

// Subscribe to block changes and run TVL logic on new blocks
// scanner
//     .subscribe({
//     start: 0,
//     end: 1000,
//     confirmation: 4,
//     concurrent: 10 // batch call
// })
//     .subscribe(function (result) {
//     console.log(result.result.events);
// });
