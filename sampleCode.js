import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@acala-network/api';
import { Token, TokenPair } from '@acala-network/sdk-core';
import WebHooks from 'node-webhooks';
import JSONFile from 'jsonfile';
import path from 'path';
import chalk from 'chalk';

// Config
const defaultStartBlock = 183612;
const configPath = path.resolve('config.json');
var config = { lastBlock: defaultStartBlock };

// Instance
const rpcAddress = "wss://karura-rpc-0.aca-api.network";
const webHookAddress = "https://node-red.acala-insight.laminar.codes/webhooks/karura";
const log = console.log;

// Instance
const webHooks = new WebHooks({
    db: {"karura": [webHookAddress]}, 
});
const provider = new WsProvider(rpcAddress);
const api = new ApiPromise(options({ provider }));

async function main() {
    log(chalk.blue.bold('SYS: ') + 'Ready');
    
    log(chalk.blue.bold('CONFIG: ') + configPath);

    try { 
        config = JSONFile.readFileSync(configPath);
        log(chalk.blue.bold('CONFIG: ') + `Loaded: Last Block ${config.lastBlock}`);
    } catch {
        log(chalk.red.bold('CONFIG Fail: ') + `Using Default: Last Block ${config.lastBlock}`);
    }

    await api.isReady;

    log(chalk.blue.bold('API: ') + 'Ready');
    
    while(1) {
        const header = await api.derive.chain.bestNumberFinalized();
        log(chalk.blue.bold('HEAD: ') + `#${header}`);

        if (header > config.lastBlock) {

            if (header == config.lastBlock + 1) {
                log(chalk.blue.bold('IMPORT BLOCK: ') + `#${header}`);
                extractBlockNumber(header);
            } else {
                log(chalk.blue.bold('SYNC BLOCK: ') + `#${config.lastBlock + 1} -> #${header}`);

                for (var blockNumber = (config.lastBlock + 1); blockNumber < header; blockNumber++) {
                    await extractBlockNumber(blockNumber);
                }
            }
        } else {
            log(chalk.blue.bold('ALREADY IMPORTED: ') + `#${header}`);
        }
        await sleep(6000);
    }

}

async function recordBlockNumber(blockNumber) {
    try { 
        config.lastBlock = blockNumber;
        JSONFile.writeFileSync(configPath, config);
        log(chalk.blue.bold('CONFIG: ') + `Saved: Last Block ${config.lastBlock}`);
    } catch(error) {
        console.log(error)
        log(chalk.red.bold('CONFIG Fail: ') + `Failed to Save`);
    }
}

async function extractBlockNumber(blockNumber) {
    log(chalk.blue.bold('WORK: ') + `Extracting Block Number: ${blockNumber}`);
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    await extractBlock(signedBlock.block);
    recordBlockNumber(blockNumber);
}

async function extractBlock(block) {
    log(chalk.blue.bold('API: ') + `Extracting Block: ${block.header.hash}`);

    const timestamp = await extractBlockTimestamp(block);
    log(chalk.blue.bold('API: ') + `Timestamp: ${timestamp}`);

    await extractBlockDexLiquidities(block, timestamp);
    await extractBlockEvents(block, timestamp);
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
    const liquidity = { 
        method: "dex.Liquidity",
        kar: balances[0].toString(),
        ksm: balances[1].toString(),
        timestamp: timestamp
    };
    // webHooks.trigger("karura", liquidity);
}

async function extractBlockEvents(block, timestamp) {
    const records = await api.query.system.events.at(block.header.hash);

    records.forEach(record => {
        const { event } = record;
        if (event.section == "dex" && event.method == "Swap") {
            extractSwapEvent(event, timestamp);
        }

        if (event.section == "dex" && event.method == "AddLiquidity") {
            extractAddLiquidityEvent(event, timestamp);
        }

        if (event.section == "dex" && event.method == "RemoveLiquidity") {
            extractRemoveLiquidityEvent(event, timestamp);
        }
    });
}

async function extractSwapEvent(event, timestamp) {
    const webHookEvent = { 
        method: "dex.Swap",
        account: event.data[0].toString(),
        fromCurrency: event.data[1][0].toString(),
        toCurrency: event.data[1][1].toString(),
        fromAmount: event.data[2].toString(),
        toAmount: event.data[3].toString(),
        timestamp: timestamp
    };
    //webHooks.trigger("karura", webHookEvent);
}

async function extractAddLiquidityEvent(event, timestamp) {
    const webHookEvent = { 
        method: "dex.AddLiquidity",
        account: event.data[0].toString(),
        currency1: event.data[1].toString(),
        amount1: event.data[2].toString(),
        currency2: event.data[3].toString(),
        amount2: event.data[4].toString(),
        share: event.data[5].toString(),
        timestamp: timestamp
    };
    // webHooks.trigger("karura", webHookEvent);
}

async function extractRemoveLiquidityEvent(event, timestamp) {
    const webHookEvent = { 
        method: "dex.RemoveLiquidity",
        account: event.data[0].toString(),
        currency1: event.data[1].toString(),
        amount1: event.data[2].toString(),
        currency2: event.data[3].toString(),
        amount2: event.data[4].toString(),
        share: event.data[5].toString(),
        timestamp: timestamp
    };
    // webHooks.trigger("karura", webHookEvent);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

main()
