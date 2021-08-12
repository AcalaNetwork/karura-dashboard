// const Scanner = require('@open-web3/scanner');
const { calculateBlockTvl } = require('./services/calculateBlockTvl');
const { ApiPromise } = require('@polkadot/api');
const { WsProvider } = require('@polkadot/rpc-provider');
const { options } = require("@acala-network/api");
const config = require("./config.json");
const chalk = require('chalk');
const log = console.log;

(async function main() {
    log(chalk.blue.bold('Start Main Function'))
    
    // Get last block scan information 
    // TODO: convert to DB.get
    let sampleResponseFromDB = {
        dex: {
            pair: {
                "KUSD/KSM": 10,
                "KAR/KSM": 11,
                timestamp: 3232
            }
        },
        loans: {
            ksmLocked: {
                collateral: 100,
                debit: 101,
                timestamp: 100000
            }
        },
        crowdloans: {
            fundsRaised: 222
        },
        header: 31222
    }
    
    // TODO: initiate scanning logic
    // while(true) {
        // dbData.lastHeader = header - 1; // testing
        await calculateBlockTvl(sampleResponseFromDB);
        // await sleep(6000);
    // }

})()


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
