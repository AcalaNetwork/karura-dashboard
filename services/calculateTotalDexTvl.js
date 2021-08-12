/**
 * Alternative implementation calulating total DEX pool TVL
 */
 const calculateTotalDexTvl = async (karuraApi) => {
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

    log("DEX Liquidity Pool data:", liquidityKUSD.map(t => t.toHuman()), liquidityKAR.map(t => t.toHuman()))

    let totalTVL = new TotalTVL(
        liquidityKUSD.map(t => t.toHuman()), 
        liquidityKAR.map(t => t.toHuman())
    );
    log("TOTAL TVL: ", totalTVL)

    log(chalk.blue.bold('Process Finished'))
}

module.exports = {
    calculateTotalDexTvl
}