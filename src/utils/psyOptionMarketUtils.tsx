import { Program, ProgramAccount } from "@project-serum/anchor";
import { Idl, IdlTypeDef } from "@project-serum/anchor/dist/cjs/idl";
import {
  IdlTypes,
  TypeDef,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { PublicKey } from "@solana/web3.js";
import { allMints } from "./global";
import { parseOptionMarket } from "./optionMarketUtils";
import { deriveSerumMarketAddress, getSerumMarketData } from "./serumUtils";
import { getAccountInfo, getProgramAccounts } from "./solanaUtils";
import { optionMarketIsNotExpired } from "./utils";

export const getAllPsyOptionMarkets = async (program: Program) => {
  const optionMarkets = await program.account.optionMarket.all();
  return optionMarkets;
};

export const getAllOpenPsyOptionMarkets = async (program: Program) => {
  const optionMarkets = await getAllPsyOptionMarkets(program);
  let filteredOptionMarkets = [];
  for (const _optionMarket of optionMarkets) {
    if (
      (allMints[_optionMarket.account.quoteAssetMint.toBase58()] &&
        // eslint-disable-next-line eqeqeq
        _optionMarket.account.underlyingAssetMint ==
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") ||
      (allMints[_optionMarket.account.underlyingAssetMint.toBase58()] &&
        // eslint-disable-next-line eqeqeq
        _optionMarket.account.quoteAssetMint ==
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
    ) {
      filteredOptionMarkets.push(_optionMarket);
    }
  }
  const filteredOptionMarkets2 = filteredOptionMarkets.filter(
    optionMarketIsNotExpired
  );
  return filteredOptionMarkets2;
};

export const getOptionMintInfo = async (optionMint: PublicKey) => {
  const optionMintAccountInfo = await getAccountInfo(optionMint);
  return optionMintAccountInfo;
};

export const getOptionMintHolders = async (optionMint: PublicKey) => {
  const optionMintHolders = await getProgramAccounts(optionMint);
  return optionMintHolders;
};

export const getSerumMarket = async (
  programId: PublicKey,
  optionMarketKey: PublicKey,
  priceCurrencyKey1: PublicKey,
  priceCurrencyKey2: PublicKey
) => {
  const [serumMarketAddress1] = await deriveSerumMarketAddress(
    programId,
    optionMarketKey,
    priceCurrencyKey1
  );
  const [serumMarketAddress2] = await deriveSerumMarketAddress(
    programId,
    optionMarketKey,
    priceCurrencyKey2
  );

  let serumMarket = await getSerumMarketData(serumMarketAddress1);
  let serumMarketKey;
  if (serumMarket) {
    serumMarketKey = serumMarketAddress1.toBase58();
  } else {
    serumMarket = await getSerumMarketData(serumMarketAddress2);
    if (serumMarket) {
      serumMarketKey = serumMarketAddress2.toBase58();
    }
  }
  if (serumMarketKey) {
    return [serumMarket, serumMarketKey];
  }
  return;
};

export const getParsedOptionMarket = async (
  optionMarket: ProgramAccount<TypeDef<IdlTypeDef, IdlTypes<Idl>>>
) => {
  const _optionMarket = await parseOptionMarket(optionMarket);
  return _optionMarket;
};

export const getParsedMarketsGroupedByPair = async (
  optionMarkets: ProgramAccount<TypeDef<IdlTypeDef, IdlTypes<Idl>>>[]
) => {
  let markets: any = {};
  for (const optionMarket of optionMarkets) {
    const parsedOptionMarket = await getParsedOptionMarket(optionMarket);
    if (
      parsedOptionMarket &&
      parsedOptionMarket.quoteAssetMint &&
      parsedOptionMarket?.underlyingAssetMint
    ) {
      const pair =
        parsedOptionMarket?.quoteAssetMint.symbol +
        "/" +
        parsedOptionMarket?.underlyingAssetMint.symbol;
      if (markets[pair]) {
        markets[pair].push(parsedOptionMarket);
      } else {
        markets[pair] = [parsedOptionMarket];
      }
    } else {
      console.error(
        "No parsedOptionMarket (and / or mint)",
        parsedOptionMarket
      );
    }
  }
  return markets;
};
