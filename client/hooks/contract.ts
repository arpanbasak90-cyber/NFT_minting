"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";

// ============================================================
// CONSTANTS
// ============================================================

/** NFT Minting Platform deployed contract ID */
export const CONTRACT_ADDRESS =
  "CD3FPZF2DCMCSUQHVQRBP6JLORSEO7HK3P3DFAVHSUOWR472K4FJHETV";

/** Network passphrase (testnet by default) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Horizon URL */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Wallet Helpers
// ============================================================

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    await setAllowed();
    await requestAccess();
  }

  const { address } = await getAddress();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

/**
 * Build, simulate, and optionally sign + submit a Soroban contract call.
 */
export async function callContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller: string,
  sign: boolean = true
) {
  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  if (!sign) {
    return simulated;
  }

  const prepared = rpc.assembleTransaction(tx, simulated).build();

  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const txToSubmit = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "FAILED") {
    throw new Error("Transaction failed on chain.");
  }

  return getResult;
}

/**
 * Read-only contract call (does not require signing).
 */
export async function readContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller?: string
) {
  const account =
    caller || Keypair.random().publicKey();
  const sim = await callContract(method, params, account, false);
  if (
    rpc.Api.isSimulationSuccess(sim as rpc.Api.SimulateTransactionResponse) &&
    (sim as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

export function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function toScValU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

export function toScValU64(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

export function toScValI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export function toScValAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function toScValBool(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

// ============================================================
// NFT Minting Platform — Contract Methods
// ============================================================

/**
 * Mint a new NFT.
 * Calls: mint(owner: Address, name: String, description: String, uri: String) -> u64
 */
export async function mintNft(
  caller: string,
  owner: string,
  name: string,
  description: string,
  uri: string
) {
  return callContract(
    "mint",
    [
      toScValAddress(owner),
      toScValString(name),
      toScValString(description),
      toScValString(uri),
    ],
    caller,
    true
  );
}

/**
 * Transfer NFT ownership.
 * Calls: transfer(from: Address, to: Address, nft_id: u64)
 */
export async function transferNft(
  caller: string,
  from: string,
  to: string,
  nftId: number
) {
  return callContract(
    "transfer",
    [
      toScValAddress(from),
      toScValAddress(to),
      toScValU64(BigInt(nftId)),
    ],
    caller,
    true
  );
}

/**
 * List an NFT for sale.
 * Calls: list(owner: Address, nft_id: u64, price: i128)
 */
export async function listNft(
  caller: string,
  owner: string,
  nftId: number,
  price: bigint
) {
  return callContract(
    "list",
    [
      toScValAddress(owner),
      toScValU64(BigInt(nftId)),
      toScValI128(price),
    ],
    caller,
    true
  );
}

/**
 * Get NFT details (read-only).
 * Calls: get_nft(nft_id: u64) -> NFT
 */
export async function getNft(nftId: number, caller?: string) {
  return readContract(
    "get_nft",
    [toScValU64(BigInt(nftId))],
    caller
  );
}

/**
 * Get all NFTs owned by an address (read-only).
 * Calls: get_owner_nfts(owner: Address) -> Vec<u64>
 */
export async function getOwnerNfts(owner: string, caller?: string) {
  return readContract(
    "get_owner_nfts",
    [toScValAddress(owner)],
    caller
  );
}

/**
 * Get total supply of NFTs (read-only).
 * Calls: total_supply() -> u64
 */
export async function getTotalSupply(caller?: string) {
  return readContract("total_supply", [], caller);
}

// NFT Interface Types
export interface NFTData {
  id: number;
  name: string;
  description: string;
  uri: string;
  owner: string;
  is_listed: boolean;
  price: number;
}

export { nativeToScVal, scValToNative, Address, xdr };
