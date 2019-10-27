/* eslint-disable import/no-unresolved */

import utils from 'zkp-utils';
import Web3 from '../src/web3';

import controller from '../src/f-token-controller';
import { getVkId, getContract } from './config';
import vkController from '../src/vk-controller';
jest.setTimeout(7200000);

Web3.connect();
const web3 = Web3.connection();

// eslint-disable-next-line no-undef
describe('f-token-controller.js tests', () => {
  const C = '0x00000000000000000000000000000020'; // 128 bits = 16 bytes = 32 chars
  const D = '0x00000000000000000000000000000030';
  const E = '0x00000000000000000000000000000040';
  const F = '0x00000000000000000000000000000010'; // don't forget to make C+D=E+F
  const skA =   '0x1111111111111111111111111111111111111111111111111111111111111111';
  const skB =   '0x2222222222222222222222222222222222222222222222222222222222222222';
  const S_A_C = '0x0f0cf75759502c8912db1ccd84212deece7d3ff757b1fb623d71c3a51cc07c91';
  const S_A_D = '0x3333333333333333333333333333333333333333333333333333333333333333';
  const sAToBE ='0x4444444444444444444444444444444444444444444444444444444444444444';
  const sAToAF ='0x5555555555555555555555555555555555555555555555555555555555555555';
  const pkA = utils.hash(skA);
  const pkB = utils.hash(skB);
  const Z_A_C = utils.concatenateThenHash(C, pkA, S_A_C);
  const Z_A_D = utils.concatenateThenHash(D, pkA, S_A_D);
  // these constants used to enable a second transfer:
  const G = '0x00000000000000000000000000000030';
  const H = '0x00000000000000000000000000000020';
  const I = '0x00000000000000000000000000000050';
  const S_B_G = '0x7777777777777777777777777777777777777777777777777777777777777777';
  const sBToEH ='0x8888888888888888888888888888888888888888888888888888888888888888';
  const sBToBI ='0x9999999999999999999999999999999999999999999999999999999999999999';
  const Z_B_G = utils.concatenateThenHash(G, pkB, S_B_G);
  const Z_B_E = utils.concatenateThenHash(E, pkB, sAToBE);
  const pkE =   '0x1111111111111111111111111111111111111111111111111111121111111111';
  // And a burn
  const Z_A_F = utils.concatenateThenHash(F, pkA, sAToAF);

  // Alice has C + D to start total = 50 ETH
  // Alice sends Bob E and gets F back (Bob has 40 ETH, Alice has 10 ETH)
  // Bob then has E+G at total of 70 ETH
  // Bob sends H to Alice and keeps I (Bob has 50 ETH and Alice has 10+20=30 ETH)
  beforeAll(async () => {
    await vkController.runController();
  });

  test('Should create 10000 tokens in accounts[0] and accounts[1]', async () => {
    // fund some accounts with FToken
    const accounts = await web3.eth.getAccounts();
    const AMOUNT = 10000;
    const bal1 = await controller.getBalance(accounts[0]);
    await controller.buyFToken(AMOUNT, accounts[0]);
    await controller.buyFToken(AMOUNT, accounts[1]);
    const bal2 = await controller.getBalance(accounts[0]);
    expect(AMOUNT).toEqual(bal2 - bal1);
  });

  test('Should move 1 ERC-20 token from accounts[0] to accounts[1]', async () => {
    const AMOUNT = 1;
    const accounts = await web3.eth.getAccounts();
    const bal1 = await controller.getBalance(accounts[0]);
    const bal3 = await controller.getBalance(accounts[1]);
    await controller.transferFToken(AMOUNT, accounts[0], accounts[1]);
    const bal2 = await controller.getBalance(accounts[0]);
    const bal4 = await controller.getBalance(accounts[1]);
    expect(AMOUNT).toEqual(bal1 - bal2);
    expect(AMOUNT).toEqual(bal4 - bal3);
  });

  test('Should burn 1 ERC-20 from accounts[1]', async () => {
    const AMOUNT = 1;
    const accounts = await web3.eth.getAccounts();
    const bal1 = await controller.getBalance(accounts[1]);
    await controller.burnFToken(AMOUNT, accounts[1]);
    const bal2 = await controller.getBalance(accounts[1]);
    expect(AMOUNT).toEqual(bal1 - bal2);
  });

  test('Should get the ERC-20 metadata', async () => {
    const accounts = await web3.eth.getAccounts();
    const { symbol, name } = await controller.getTokenInfo(accounts[0]);
    expect('OPS').toEqual(symbol);
    expect('EY OpsCoin').toEqual(name);
  });

  test('Should mint an ERC-20 commitment Z_A_C for Alice for asset C', async () => {
    const { contractJson: fTokenShieldJson, contractInstance: fTokenShield } = await getContract(
      'FTokenShield',
    );
    const vkId = await getVkId('MintCoin');

    const accounts = await web3.eth.getAccounts();
    console.log('Alices account ', (await controller.getBalance(accounts[0])).toNumber());
    const [zTest, zIndex] = await controller.mint(C, pkA, S_A_C, vkId, {
      account: accounts[0],
      fTokenShieldJson,
      fTokenShieldAddress: fTokenShield.address,
    });

    expect(Z_A_C).toEqual(zTest);
    expect(0).toEqual(parseInt(zIndex, 10));
    console.log(`Alice's account `, (await controller.getBalance(accounts[0])).toNumber());
  });

  test('Should mint another ERC-20 commitment Z_A_D for Alice for asset D', async () => {
    const { contractJson: fTokenShieldJson, contractInstance: fTokenShield } = await getContract(
      'FTokenShield',
    );
    const vkId = await getVkId('MintCoin');
    const accounts = await web3.eth.getAccounts();
    const [zTest, zIndex] = await controller.mint(D, pkA, S_A_D, vkId, {
      account: accounts[0],
      fTokenShieldJson,
      fTokenShieldAddress: fTokenShield.address,
    });
    expect(Z_A_D).toEqual(zTest);
    expect(1).toEqual(parseInt(zIndex, 10));
    console.log(`Alice's account `, (await controller.getBalance(accounts[0])).toNumber());
  });

  test('Should transfer a ERC-20 commitment to Bob (two coins get nullified, two created; one coin goes to Bob, the other goes back to Alice as change)', async () => {
    // E becomes Bob's, F is change returned to Alice
    const accounts = await web3.eth.getAccounts();
    const { contractJson: fTokenShieldJson, contractInstance: fTokenShield } = await getContract(
      'FTokenShield',
    );
    const vkId = await getVkId('TransferCoin');
    const blockchainOptions = {
      account: accounts[0],
      fTokenShieldJson,
      fTokenShieldAddress: fTokenShield.address
    };
    const inputCommitments = [
      { value: C, salt: S_A_C, commitment: Z_A_C, index: 0 },
      { value: D, salt: S_A_D, commitment: Z_A_D, index: 1 },
    ];

    const outputCommitments = [{ value: E, salt: sAToBE}, { value: F, salt: sAToAF }];
    await controller.transfer(inputCommitments, outputCommitments, pkB, skA, vkId, blockchainOptions);
    // now Bob should have 40 (E) ETH

  });

  test('Should mint another ERC-20 commitment Z_B_G for Bob for asset G', async () => {
    const { contractJson: fTokenShieldJson, contractInstance: fTokenShield } = await getContract(
      'FTokenShield',
    );
    const vkId = await getVkId('MintCoin');
    const accounts = await web3.eth.getAccounts();
    const blockchainOptions = {
      account: accounts[1],
      fTokenShieldJson,
      fTokenShieldAddress: fTokenShield.address
    };
    const [zTest, zIndex] = await controller.mint(G, pkB, S_B_G, vkId, blockchainOptions);

    expect(Z_B_G).toEqual(zTest);
    expect(4).toEqual(parseInt(zIndex, 10));
  });

  test('Should transfer an ERC-20 commitment to Eve', async () => {
    // H becomes Eve's, I is change returned to Bob

    const { contractJson: fTokenShieldJson, contractInstance: fTokenShield } = await getContract(
      'FTokenShield',
    );
    const vkId = await getVkId('TransferCoin');
    const accounts = await web3.eth.getAccounts();

    const blockchainOptions = {
      account: accounts[1],
      fTokenShieldJson,
      fTokenShieldAddress: fTokenShield.address
    };
    const inputCommitments = [
      { value: E, salt: sAToBE , commitment: Z_B_E, index: 2 },
      { value: G, salt: S_B_G , commitment: Z_B_G, index: 4 },
    ];

    const outputCommitments = [{ value: H, salt: sBToEH }, { value: I, salt: sBToBI }];

    await controller.transfer(inputCommitments, outputCommitments, pkE, skB, vkId, blockchainOptions);
  });

  test(`Should burn Alice's remaining ERC-20 commitment`, async () => {
    const { contractJson: fTokenShieldJson, contractInstance: fTokenShield } = await getContract(
      'FTokenShield',
    );
    const vkId = await getVkId('BurnCoin');
    const accounts = await web3.eth.getAccounts();

    const blockchainOptions = {
      account: accounts[0],
      fTokenShieldJson,
      fTokenShieldAddress: fTokenShield.address,
      tokenReceiver: accounts[3]
    };
    const bal1 = await controller.getBalance(accounts[3]);
    const bal = await controller.getBalance(accounts[0]);
    console.log('accounts[3]', bal1.toNumber());
    console.log('accounts[0]', bal.toNumber());
    await controller.burn(F, skA, sAToAF, Z_A_F, 3, vkId, blockchainOptions);
    const bal2 = await controller.getBalance(accounts[3]);
    console.log('accounts[3]', bal2.toNumber());
    expect(parseInt(F, 16)).toEqual(bal2 - bal1);
  });
});
