const { ApiPromise, WsProvider } = require("@polkadot/api");
const { options } = require("@acala-network/api");
const TotalTVL = require('../models/TotalTVL');
const config = require("../config.json");
const chalk = require('chalk');
const log = console.log

const karuraProvider = new WsProvider(config.KARURA_PROVIDER);
const karuraApi = new ApiPromise(
    options({
        provider: karuraProvider,
    })
);

/**
 * Alternative implementation calulating total DEX pool TVL
 */
 const calculateTotalDexTvl = async () => {
    log(chalk.blue.bold('Start calculateTotalDexTvl'))

    await karuraApi.isReady
    log(chalk.blue.bold('API Ready'));


    const liquidityKUSD = await karuraApi.query.dex.liquidityPool([
        { Token: "KUSD" },
        { Token: "KSM" },
    ]);
    
    const liquidityKAR = await karuraApi.query.dex.liquidityPool([
        { Token: "KAR" },
        { Token: "KSM" },
    ]);

    log("DEX Liquidity Pool data:", liquidityKUSD.map(t => t.toString()), liquidityKAR.map(t => t.toHuman()))

    let totalTVL = new TotalTVL(
        liquidityKUSD.map(t => t.toString()), 
        liquidityKAR.map(t => t.toString())
    );
    log("TOTAL TVL: ", totalTVL)

    log(chalk.blue.bold('Process Finished'))
}

module.exports = {
    calculateTotalDexTvl
}