module.exports = class BlockTvl {
    constructor (dexLiquidity, loanBalances) {

        /**
         * 
         */
        this.dex = {}
        dexLiquidity.map((e) => {
            const key = e.pair.join('/');
            this.dex[key] = e.data;
        });

        this.loans = {}
        this.loans.ksmLocked = {}
        this.loans.ksmLocked.collateral = loanBalances.collateral
        this.loans.ksmLocked.debit = loanBalances.debit
        this.loans.ksmLocked.timestamp = loanBalances.timestamp
    }


};