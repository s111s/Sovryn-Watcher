/**
 * Test the position scanner loop
*/
import conf from '../config/config_mainnet';
import abiComplete from '../config/abiComplete';
import PosScanner from '../controller/scanner';
import C from '../controller/contract';
import U from '../util/helper';
const assert = require('assert');
const abiDecoder = require('abi-decoder');
abiDecoder.addABI(abiComplete);
C.init(conf);

let positions = {}
let liquidations = {};



describe('Scanner', async () => {
    describe('#Open positions', async () => {
        before('init', async () => {
            PosScanner.start(conf, positions, liquidations, false);
        });

        it('should find open positions on the Sovryn contract', async () => {
            let spread=5;
            let from = 0;
            let to = spread;

            while (true) {
                const pos = await PosScanner.loadActivePositions(from, to);
               
                if (pos && pos.length > 0) {
                    console.log(pos.length + " active positions found");
                    from = to;
                    to = from + spread;
                    await U.wasteTime(1);
                }
                //reached current state
                else if(pos && pos.length==0) {
                    console.log("Round ended. "+Object.keys(positions).length + " active positions found");

                    await U.wasteTime(10);
                    from = 0;
                    to = spread;

                    for (let k in positions) if (positions.hasOwnProperty(k)) delete positions[k];
                }
                //error retrieving pos for this interval
                else {
                    console.log("error retrieving pos for this interval. continue")
                    from = to;
                    to = from + spread;
                    await U.wasteTime(1);
                }
            }
        });
    });
});




/*
**************************************************************************
********************helpers***********************************************
**************************************************************************
*/



/**
 * Parse the loan event log and returns the loan-id
 */
function parseLog(txHash) {
    console.log("parsing log");
    return new Promise(resolve => {
        C.web3.eth.getTransactionReceipt(txHash, function (e, receipt) {
            const decodedLogs = abiDecoder.decodeLogs(receipt.logs);

            for (let i = 0; i < decodedLogs.length; i++) {

                if (decodedLogs[i] && decodedLogs[i].events && decodedLogs[i].name && decodedLogs[i].name == "Borrow") {
                    //console.log(decodedLogs[i].events)
                    return resolve(decodedLogs[i].events[2].value);
                }
            }
        });
    });
}