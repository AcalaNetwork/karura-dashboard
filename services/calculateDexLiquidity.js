const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Token, TokenPair } = require('@acala-network/sdk-core');
const TotalTVL = require('../models/TotalTVL');
const BlockTVL = require('../models/BlockTVL')
const { options } = require("@acala-network/api");
const config = require("../config.json");
const chalk = require('chalk');
const log = console.log;

const provider = new WsProvider(config.WS_PROVIDER);
const api = new ApiPromise(
    options({
      provider,
    })
);

/**
 * One implementation calulating total DEX pool TVL
 */
const calculateTotalDexTvl = async () => {
    log(chalk.blue.bold('Start calculateTotalDexTvl'))

    await api.isReady
    log(chalk.blue.bold('API Ready'));


    const liquidityKUSD = await api.query.dex.liquidityPool([
        { Token: "KUSD" },
        { Token: "KSM" },
    ]);
    
    const liquidityKAR = await api.query.dex.liquidityPool([
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

/**
 * Another implementation calulating TVL of a DEX pool at a specific block
 * @param {*} header 
 */
const calculateBlockDexTvl = async (header) => {
    log(chalk.blue.bold('Start calculateBlockDexTvl'));
    log(chalk.blue.bold('Header: ') + `#${header}`);
    await extractBlockNumber(header);
}

async function extractBlockNumber(blockNumber) {
    log(chalk.blue.bold('Extracting Block Number:'), blockNumber);
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    await extractBlock(signedBlock.block);
    // recordBlockNumber(blockNumber);
}

async function extractBlock(block) {
    log(chalk.blue.bold('API: ') + `Extracting Block: ${block.header.hash}`);

    const timestamp = await extractBlockTimestamp(block);
    log(chalk.blue.bold('API: ') + `Timestamp: ${timestamp}`);

    await extractBlockDexLiquidities(block, timestamp);
    // await extractBlockEvents(block, timestamp);
}

async function extractBlockTimestamp(block) {
    const timestamp = await api.query.timestamp.now.at(block.header.hash);
    return timestamp.toString();
}

async function extractBlockDexLiquidities(block, timestamp) {
    const kar = api.registry.createType('CurrencyId', { Token: "KAR" });
    const ksm = api.registry.createType('CurrencyId', { Token: "KSM" });
    const tradingPair = new TokenPair(Token.fromCurrencyId(kar), Token.fromCurrencyId(ksm)).toTradingPair(api);
    extractBlockDexLiquidity(block, tradingPair, timestamp);
}

async function extractBlockDexLiquidity(block, tradingPair, timestamp) {
    const balances = await api.query.dex.liquidityPool.at(block.header.hash, tradingPair);
    // console.log("BALANCES", balances)
    const liquidity = { 
        method: "dex.Liquidity",
        kar: balances[0].toString(),
        ksm: balances[1].toString(),
        timestamp: timestamp
    };
    log('extractBlockDexLiquidity: ', liquidity)
    
    let blockTVL = new BlockTVL(liquidity)
    log('BLOCK TVL', blockTVL)
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = {
    calculateTotalDexTvl,
    calculateBlockDexTvl
}