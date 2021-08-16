module.exports = class TotalTvl {
    constructor (liquidityKUSD, liquidityKAR) {
        /**
            Generate DEX Data
             * @param dexTvl {
                * @param kusdKsmPair {
                    * @param kusd
                    * @param ksm
                * }
                * @param karKsmPair {
                    * @param kar
                    * @param ksm
                * }
                * // TODO : adjust values to USD
                * @param totals {
                    * @param dexTotal
                    * @param karKsmTotal
                    * @param kusdKsmTotal
                * }
            * }
         */
        this.dexTvl = {}
        this.dexTvl.kusdKsmPair = {}
        this.dexTvl.karKsmPair = {}
        this.dexTvl.kusdKsmPair.kusd = liquidityKUSD[0][0]
        this.dexTvl.kusdKsmPair.ksm = liquidityKUSD[0][1]
        this.dexTvl.karKsmPair.kar = liquidityKAR[1][0]
        this.dexTvl.karKsmPair.ksm = liquidityKAR[1][1]
        this.dexTvl.totals = this.calculateDexTotals()

        /**
            Generate stablecoin TVL
         * @param 
        */

        /**
            Generate crowdloan TVL
            * @param somebody
        */
    }

    /**
     * Takes .toHuman() representation of a currency and returns a unit
     * i.e. MKAR = 1 million KKAR = 1000
        * @param currency
    */
    calculateUnit(currency) {
        switch(currency) {
            case 'mkar':
                return 1000000;
            case 'kkar':
                return 1000;
            default:
                console.error("cannot find currency")
                throw new Error('Invalid currency given to BlockTvl.calculateUnit')
        }
    }

    /**
     * Takes a .toHuman response from dex.liquiditypool query and calculates the raw unit of currency
     * i.e. 500 MKAR = 500 KAR * 1,000,000 = 500,000,000 KAR
        * @param '500 MKAR'
    */
    getLiquidityValue(str) {
        const currency = str.substring(str.length - 4).toLowerCase();
        const unit = this.calculateUnit(currency);
        const value = str.substring(0, str.indexOf(' '));
        return value * unit 
    }

    /**
     * Calculates the totals of the current totals for dex data for this block
    */
    calculateDexTotals() {
        console.log(this.dexTvl.karKsmPair, this.dexTvl.karKsmPair)
        return {
            kusdKsmTotal: this.dexTvl.kusdKsmPair.kusd + this.dexTvl.kusdKsmPair.ksm,
            karKsmTotal: this.dexTvl.karKsmPair.kar + this.dexTvl.karKsmPair.ksm,
            dexTotal: this.dexTvl.kusdKsmPair.kusd + this.dexTvl.kusdKsmPair.ksm + this.dexTvl.karKsmPair.kar + this.dexTvl.karKsmPair.ksm
        }
    }
}
