const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Token, TokenPair } = require('@acala-network/sdk-core');
const BlockTVL = require('../models/BlockTVL')
const { options } = require("@acala-network/api");
const chalk = require('chalk');
let config = require("../config.json");
const log = console.log;

// Mongo DB connections
const { MongoClient } = require('mongodb');
const client = new MongoClient(config.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const tvl = client.db("kusama-statistics").collection("total-value-locked");

// Blockchain connections
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

/**
 * Implementation calulating TVL of a DEX pool at a specific block
 * @param {obj} lastBlock the previous tvl data form the last successful run of the scan
 */
const calculateBlockTvl = async (lastBlock) => {
    await karuraApi.isReady;
    let header = await karuraApi.derive.chain.bestNumberFinalized();

    let previousHeader;
    if (lastBlock === undefined) {
        previousHeader = header - 1;
        lastBlock = {};
        lastBlock.header = header - 1;
    } else {
        previousHeader = lastBlock.header
    }

    log(chalk.blue.bold('Start calculateBlockTvl'));
    log(chalk.blue.bold('DB: ') + `Loaded: Last Block ${previousHeader}`);
    log(chalk.blue.bold('HEADER: current header number: ') + header);

    // Run logic for each block between the last run block and the current block
    if (header > previousHeader) {
        if (header == previousHeader + 1) {
            log(chalk.blue.bold('IMPORT BLOCK: ') + `#${header}`);
            extractBlockNumber(header, lastBlock);
        } else {
            for (let blockNumber = (previousHeader + 1); blockNumber <= header; blockNumber++) {
                log(chalk.blue.bold('IMPORT BLOCK: ') + `#${blockNumber}`);
                await extractBlockNumber(blockNumber);
            }
        }
    } else {
        log(chalk.blue.bold('ALREADY RUN EXTRACTION FOR THIS BLOCK, returning ') + `#${header}`);
    }
};

async function extractBlockNumber(blockNumber) {
    const blockHash = await karuraApi.rpc.chain.getBlockHash(blockNumber);
    const signedBlock = await karuraApi.rpc.chain.getBlock(blockHash);
    await extractBlock(signedBlock.block, blockNumber);
}

async function extractBlock(block, blockNumber) {
    log(chalk.blue.bold('API: ') + `Extracting Block: ${block.header.hash}`);

    const timestamp = await karuraApi.query.timestamp.now.at(block.header.hash);
    log(chalk.blue.bold('API: ') + `Timestamp: ${timestamp.toString()}`);

    await extractBlockDexLiquidities(block, timestamp.toString(), blockNumber);
    // await extractBlockEvents(block, timestamp);
}

async function extractBlockDexLiquidities(block, timestamp, blockNumber) {
    const tradingPairs = config.TOKEN_PAIRS.map((pair) => {
        const tokenA = karuraApi.registry.createType('CurrencyId', { Token: pair[0] });
        const tokenB = karuraApi.registry.createType('CurrencyId', { Token: pair[1] });
        const tradingPair = new TokenPair(Token.fromCurrencyId(tokenA), Token.fromCurrencyId(tokenB)).toTradingPair(karuraApi) 
        return new Promise((resolve, reject) => {
            karuraApi.query.dex.liquidityPool.at(block.header.hash, tradingPair)
            .then(res => {
                resolve({
                    pair: pair,
                    data: res
                })
            })
            .catch(e => {
                reject(e)
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
    });

    // Total Loan Positions
    const loanBalances = await karuraApi.query.loans.totalPositions({ TOKEN: 'KSM' });
    const loanPositions = {
        timestamp: timestamp,
        collateral: loanBalances.collateral.toString(),
        debit: loanBalances.debit.toString(),
    }

    // Total Crowd Loan Funds
    const crowdloan = await kusamaApi.query.crowdloan.funds(config.KUSAMA_CROWDLOAN_ID);
    const fundsRaised = crowdloan.toString().raised;
    
    // Final Block Data
    let blockTVL = new BlockTVL(liquidity, loanPositions, fundsRaised, blockNumber.toString())

    // write lastBlock informaiton to DB
    await recordBlockData(blockTVL);
}

async function recordBlockData (blockTVL) {   
    await client.connect();
    await tvl.insertOne(blockTVL, (err, data) => {
        if (err) {
            throw new Error("Error occured while saving scan results")
        }
    });

    log(chalk.blue.bold('SAVED BLOCK: ') + `${blockTVL.header}`);
    return
}

module.exports = {
    calculateBlockTvl
}