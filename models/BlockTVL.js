module.exports = class BlockTvl {
    constructor (dexLiquidity, loanBalances, fundsRaised, header) {

        /**
         * Generates a TVL object 
         * @param {
         *      dex: {
         *          pair: {
         *             "KUSD/KSM": 10,
         *             "KAR/KSM": 11,
         *             timestamp: 3232
         *          }
         *      }
         * } dexLiquidity
         * @param {
         *      loans: {
         *          ksmLocked: {
         *              collateral: 100,
         *              debit: 101,
         *              timestamp: 100000
         *          }
         *      }
         * }
         * @param {
         *      crowdloans: {
         *          fundsRaised: 222
         *      }
         * } fundsRaised
         * @param {number} header
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
         * Current header number
         */
        this.header = Number(header)
    }
};