import * as anchor from "@project-serum/anchor";
import { TokenListProvider } from "@solana/spl-token-registry";
export const endpoint: string = "https://ssc-dao.genesysgo.net";
export const connection: anchor.web3.Connection = new anchor.web3.Connection(
  endpoint
);
export const textEncoder: TextEncoder = new TextEncoder();
export const SERUM_DEX_V3 = new anchor.web3.PublicKey(
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
);
export const PSY_PROGRAM_ID = new anchor.web3.PublicKey(
  "R2y9ip6mxmWUj4pt54jP2hz2dgvMozy9VTSwMWE7evs"
);
