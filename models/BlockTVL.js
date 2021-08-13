module.exports = class BlockTvl {
    constructor (dexLiquidity, loanBalances, fundsRaised, previousHeader, header) {

        /**
         * Generates a TVL object 
         * @ param {}
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
        this.previousHeader = Number(previousHeader)

        /**
         * Current header number
         */
        this.header = Number(header)
    }
};