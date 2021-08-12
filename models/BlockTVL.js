module.exports = class BlockTvl {
    constructor (dexLiquidity, loanBalances, fundsRaised, previousHeader, header) {

        /**
         * 
         */
        this.dex = {}
        dexLiquidity.map((e) => {
            const key = e.pair.join('/');
            this.dex[key] = e.data;
        });

        /**
         * KSM locked in crowdloans
         */
        this.loans = {}
        this.loans.ksmLocked = {}
        this.loans.ksmLocked.collateral = loanBalances.collateral
        this.loans.ksmLocked.debit = loanBalances.debit
        this.loans.ksmLocked.timestamp = loanBalances.timestamp

        /**
         * KSM locked in stablecoins
         */

        this.crowdloans = {}
        this.crowdloans.fundsRaised = fundsRaised

        /**
         * Previous block header number
         */
        this.previousHeader = previousHeader

        /**
         * Current header number
         */
        this.header = header
    }
    


};
/**
 * let sampleResponseFromDB = {
    dex: {
        "KUSD/KSM": {method: 'dex.Liquidity', KAR: '820077316514527743', KSM: '24365324269623242', timestamp: '1628739840420'},
        "KAR/KSM": {method: 'dex.Liquidity', KUSD: '4906072888138308815', KSM: '21036133230812230', timestamp: '1628739840420',
    },
    loans: {
        ksmLocked: {
            collateral: '76491022560919940', 
            debit: '49913254838749970225', 
            timestamp: '1628739840420'
        }
    },
    crowdloans: {
        fundsRaised: 222
    },
    previousHeader: 31222
}   
 */