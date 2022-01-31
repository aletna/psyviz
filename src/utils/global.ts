import * as anchor from "@project-serum/anchor";
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
export const WRAPPED_BTC_MINT = new anchor.web3.PublicKey(
  "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E"
);
export const WRAPPED_ETH_MINT = new anchor.web3.PublicKey(
  "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk"
);
export const WRAPPED_SOL_MINT = new anchor.web3.PublicKey(
  "So11111111111111111111111111111111111111112"
);
export const allMints: any = {
  "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk": "ETH",
  "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E": "BTC",
  So11111111111111111111111111111111111111112: "SOL",
};
export const CurrencyPairs = {
  BTC_USDC: "BTC/USDC",
};

export const pairToCoinGecko: any = {
  "BTC/USDC": "bitcoin",
  "SOL/USDC": "solana",
  "soETH/USDC": "ethereum",
};
