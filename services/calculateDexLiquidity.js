const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Token, TokenPair } = require('@acala-network/sdk-core');
const TotalTVL = require('../models/TotalTVL');
const BlockTVL = require('../models/BlockTVL')
const { options } = require("@acala-network/api");
const chalk = require('chalk');
let config = require("../config.json");
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
 * Alternative implementation calulating TVL of a DEX pool at a specific block
 * @param {*} header the current block header
 */
const calculateBlockDexTvl = async () => {
    const header = 315499;
    config.lastBlock = header - 1; // for testing
    log(chalk.blue.bold('Start calculateBlockDexTvl'));
    log(chalk.blue.bold('CONFIG: ') + `Loaded: Last Block ${config.lastBlock}`);
    log(chalk.blue.bold('HEADER: header number: ') + header);

    // Run logic for each block between the last run block and the current block
    if (header > config.lastBlock) {
        if (header == config.lastBlock + 1) {
            log(chalk.blue.bold('IMPORT BLOCK: ') + `#${header}`);
            extractBlockNumber(header);
        } else {
            for (let blockNumber = (config.lastBlock + 1); blockNumber <= header; blockNumber++) {
                log(chalk.blue.bold('Running extractBlockNumber with block number: ') + `#${blockNumber}`);
                await extractBlockNumber(blockNumber);
            }
        }
    } else {
        log(chalk.blue.bold('ALREADY RUN EXTRACTION FOR THIS BLOCK, returning ') + `#${header}`);
    }
};

async function extractBlockNumber(blockNumber) {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    await extractBlock(signedBlock.block, blockNumber);
}

async function extractBlock(block, blockNumber) {
    log(chalk.blue.bold('API: ') + `Extracting Block: ${block.header.hash}`);

    const timestamp = await api.query.timestamp.now.at(block.header.hash);
    log(chalk.blue.bold('API: ') + `Timestamp: ${timestamp.toString()}`);

    await extractBlockDexLiquidities(block, timestamp.toString(), blockNumber);
    // await extractBlockEvents(block, timestamp);
}

async function extractBlockDexLiquidities(block, timestamp, blockNumber) {
    const tradingPairs = config.TOKEN_PAIRS.map((pair) => {
        const tokenA = api.registry.createType('CurrencyId', { Token: pair[0] });
        const tokenB = api.registry.createType('CurrencyId', { Token: pair[1] });
        const tradingPair = new TokenPair(Token.fromCurrencyId(tokenA), Token.fromCurrencyId(tokenB)).toTradingPair(api) 
        return new Promise((resolve, reject) => {
            api.query.dex.liquidityPool.at(block.header.hash, tradingPair).then(res => {
                resolve({
                    pair: pair,
                    data: res
                })
            });
        });
    });
    await extractBlockValue(tradingPairs, timestamp, blockNumber);
}

async function extractBlockValue(tradingPairs, timestamp, blockNumber) {
    const dexBalances = await Promise.all(tradingPairs);
    const liquidity = dexBalances.map((balance) => {
        return {
            data: {
                method: "dex.Liquidity",
                [balance.pair[0]]: balance.data[0].toString(),
                [balance.pair[1]]: balance.data[1].toString(),
                timestamp: timestamp
            },
            pair: balance.pair,
        }
    })
    log('dexBalances: ', liquidity)

    // TODO : move to config
    const loanBalances = await api.query.loans.totalPositions({ TOKEN: 'KSM' });
    const loanPositions = {
        timestamp: timestamp,
        collateral: loanBalances.collateral.toString(),
        debit: loanBalances.debit.toString(),
    }
    log('LOAN BALANCES: ', loanPositions)
    
    let blockTVL = new BlockTVL(liquidity, loanPositions)
    log('BLOCK TVL', blockTVL)

    // write block data to DB

    // write lastBlock informaiton to DB
    // TODO: implement DB 
    recordBlockNumber(blockNumber);
}

function recordBlockNumber (blockNumber) {
    config.lastBlock = blockNumber;
    log(chalk.blue.bold('CONFIG: ') + `Saved: Last Block ${blockNumber}`);
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