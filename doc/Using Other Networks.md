# Using Other Networks

By default, the commands `./nightfall` and `./nightfall-test` will run on local Ganache networks and have no connection to networks outside of your machine.

This guide explains how to run Nightfall on live networks. 

Notice from the [README](../README.md):

> Note that this code has not yet completed a security review and therefore we strongly recommend that you do not use it in production or to transfer items of material value. We take no responsibility for any loss you may incur through the use of this code.

## Running an integration test on Ropsten

These instructions will allow you to deploy and use Nightfall on the Ropsten network.

1. Run Go Ethereum ("geth") connected to the Ropsten network

   ```sh
   docker-compose -f docker-compose.ropsten.yml up geth_test
   ```

   * Sycing will take approximately 2 hours.
   * By default, this is a "light" node. Go Ethereum documentation is currently [deficient](https://github.com/ethereum/go-ethereum/issues/20184) in explaining the risks of "light" mode, but for production usage you should use a "full" node.

2. Create an account and get Ether

   1. Attach to geth console

      ```sh
      docker-compose -f docker-compose.test.yml run geth_test attach 'http://geth_test:8545'
      ```

   2. Get the default account address

      ```
      > personal.listAccounts
      ```

      or create one

      ```
      > personal.newAccount('some good passphrase')
      ```

   3. Unlock the account

      ```
      > personal.unlockAccount('<DEFAULT_ACCOUNT>', 'some good passphrase', 99999)
      ```

   4. Get Ether into your account using the [MetaMask Ropsten Faucet](https://faucet.metamask.io/) or other source

3. Run Nightfall

   1. Remove existing build artifacts

      ```sh
      rm -rf offchain/build-test/contracts/  
      rm -rf zkp/build-test/contracts/
      ```

      Note: this step is optional. If you will not want to rebuild artifacts then comment out `make offchain-test-migrate` in nightfall-test.

   2. Run `./nightfall-test`

## Other production notes

**Backing up mongo database**

You can backup your database using:

```sh
docker run --rm -v nightfall_mongo_volume_test:/volume -v /tmp/a:/backup loomchild/volume-backup \
backup mongovolume.tar.bz2
```

**Backing up mongo keystone**

See the files at `~/.ethereum/testnet/keystore`