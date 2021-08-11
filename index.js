// const Scanner = require('@open-web3/scanner');
const { calculateBlockDexTvl, calculateTotalDexTvl } = require('./services/calculateDexLiquidity');
const { ApiPromise } = require('@polkadot/api');
const { WsProvider } = require('@polkadot/rpc-provider');
const { options } = require("@acala-network/api");
const config = require("./config.json");
const chalk = require('chalk');
const log = console.log;

const provider = new WsProvider(config.WS_PROVIDER);
const api = new ApiPromise(
    options({
      provider,
    })
);

(async function main() {
    log(chalk.blue.bold('Start Main Function'))

    await calculateTotalDexTvl();
    
    // TODO: initiate scnning logic
    // while(true) {
        const header = await api.derive.chain.bestNumberFinalized();
        await calculateBlockDexTvl(header);
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
