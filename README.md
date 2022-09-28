
# Stargaze Royalty Splitter

A simple off-chain royalty splitter script for Stargaze

When helping with the launch of a few NFT projects on Stargaze, I needed a way to automatically distribute royalties post-mint and all the accumulated secondary's. 

As there was no ability to deploy an existing Royalty Split contract, this worked as a quick off-chain solution. Stargaze is soon coming out with their own on-chain contracts to handle this, so I figured now is a good time to just release it as an example of interacting with the chain using Cosmwasm js.

It is not entirely recommended to use this, best to wait for the official on-chain version. However, this has been in use for the last few months powering the Space Apes and Space Apes Mutant distributions. 

Configure the Distributions array to have a name, the seed of the wallet receiving the funds, the wallet address, and all the holders and their percentage breakdown. Use the existing template as an example. This can handle any number of receiving wallets to distribute from. When running, this will check every 60 seconds. If the balance is > 2000 stars, it will divide and submit a transaction with the breakdowns.

**Do not run this unless you know what you are doing!**