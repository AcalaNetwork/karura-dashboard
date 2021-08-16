// const Scanner = require('@open-web3/scanner');
const { calculateBlockTvl } = require('./services/calculateBlockTvl');
const chalk = require('chalk');
const config = require("./config.json");
const { sleep } = require("./util/index");
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { options } = require("@acala-network/api");
const log = console.log

// MongoDB connection
const { MongoClient } = require('mongodb');
const client = new MongoClient(config.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const tvl = client.db("kusama-statistics").collection("total-value-locked");

// // Blockchain connections
const karuraProvider = new WsProvider(config.KARURA_PROVIDER);
const karuraApi = new ApiPromise(
    options({
        provider: karuraProvider,
    })
);
const kusamaProvider = new WsProvider(config.KUSAMA_PROVIDER);
const kusamaApi = new ApiPromise(
    options({
        provider: kusamaProvider,
    })
);

(async function main() {
    log(chalk.blue.bold('Start Main Function'));
    let lastScanRecord;

    // Await valid connections
    try {
        await client.connect();
        await karuraApi.isReady;
        await kusamaApi.isReady;
    } catch (e) {
        console.error("Unable to establish connections with blockchain or database",  e)
        throw new Error("Unable to establish connections with blockchain or database")
    }

    log(chalk.blue.bold('Initiate loop'));
    while(true) {
        try {
            lastScanRecord = await tvl.findOne({}, { sort:{ $natural:-1 } })
            
            await calculateBlockTvl(lastScanRecord, karuraApi, kusamaApi);

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
