require('dotenv').config();
const cosmwasm = require("cosmwasm");
const mnemonic = process.env.seed || null;
const mnemonic2 = process.env.seed2 || null;


const DISTRIBUTIONS = [
    {
        "name": "Collection 1", "seed": mnemonic, "wallet": "stars1", "wallets": [
            { "name": "Deploydon", "percent": 10, "address": "stars1" },
            { "name": "Treasury", "percent": 50, "address": "stars1" },
            { "name": "Creator", "percent": 40, "address": "stars1" },
        ]
    },
    {
        "name": "Collection 2", "seed": mnemonic2, "wallet": "stars1", "wallets": [
            { "name": "Deploydon", "percent": 10, "address": "stars1" },
            { "name": "Treasury", "percent": 50, "address": "stars1" },
            { "name": "Creator", "percent": 40, "address": "stars1" },
        ]
    }
]

const DISTRO_TIME = 60; //Time between redistribution checks, in minutes.
const MIN_DISTRIBUTE = 2000; //Minimum balance to have to begin distributions
const MIN_BALANCE = 100; //Minimum balance the distributor wallet will maintain

//-------------------------------------------------------------
//You shouldn't need to modify anything under here.

if (!mnemonic || !mnemonic2) {
    console.log("No mnemonic set. Set the seed env variable as your mnemonic before continuing.");
    process.exit(0);
}
const RPC = "https://rpc.stargaze-apis.com/";
var ROYALTY_RECEIVE = "";
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

function enfoceRoyalties() {
    for (var i = 0; i < DISTRIBUTIONS.length; i++) {
        var distWallets = DISTRIBUTIONS[i].wallets;
        console.log("Checking distribution " + DISTRIBUTIONS[i].name + " Wallets: " + distWallets.length);
        var total = 0;
        for (var x = 0; x < distWallets.length; x++) {
            total += distWallets[x].percent;
        }
        if (total != 100) {
            console.log("Total royalties must be 100%");
            return false;
        }
    }
    return true;
}

async function main() {
    if (!enfoceRoyalties()) {
        process.exit(0);
    }
    do {
        for (var x = 0; x < DISTRIBUTIONS.length; x++) {
            var dist = DISTRIBUTIONS[x];
            var wallets = dist.wallets;
            console.log("Processing distribution for: " + dist.name);
            var client = await getClient(dist.seed);
            var balanceResp = await client.getBalance(ROYALTY_RECEIVE, 'ustars');
            var balance = balanceResp.amount / 1_000_000;
            console.log("Balance:", balance);
            if (balance <= MIN_DISTRIBUTE) {
                console.log("Not enough to distribute. Skipping...");
            } else {
                var toDistribute = balance - MIN_BALANCE;
                console.log("To Distribute: " + toDistribute);
                var messages = [];
                for (var i = 0; i < wallets.length; i++) {
                    var member = wallets[i];
                    var memberAmount = Math.floor(toDistribute * (member.percent / 100));
                    console.log(member.name + " To Receive: " + memberAmount);
                    var msgSend = {
                        fromAddress: ROYALTY_RECEIVE,
                        toAddress: member.address,
                        amount: cosmwasm.coins(memberAmount * 1_000_000, "ustars"),
                    };
                    var msgAny = {
                        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                        value: msgSend,
                    };
                    messages.push(msgAny);
                }
                console.log("Submitting...");
                var signed = await client.signAndBroadcast(ROYALTY_RECEIVE, messages, "auto", "Royalty Distribution");
                console.log(signed);

                console.log("Done. Waiting for next cycle...");
            }
        }
        await sleep(DISTRO_TIME * 60 * 1000);
    } while (true);
}

async function getClient(seed) {
    const gasPrice = cosmwasm.GasPrice.fromString('0ustars');
    const wallet = await cosmwasm.DirectSecp256k1HdWallet.fromMnemonic(seed, {
        prefix: 'stars',
    });
    const [{ address, pubkey }] = await wallet.getAccounts();
    console.log("Address: ", address);
    ROYALTY_RECEIVE = address;
    return await cosmwasm.SigningCosmWasmClient.connectWithSigner(
        RPC,
        wallet,
        { gasPrice }
    );
}
main();