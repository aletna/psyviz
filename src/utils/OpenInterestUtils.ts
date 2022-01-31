import { ProgramAccount } from "@project-serum/anchor";
import { Idl, IdlTypeDef } from "@project-serum/anchor/dist/cjs/idl";
import {
  IdlTypes,
  TypeDef,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { PublicKey } from "@solana/web3.js";
import moment from "moment";
import { findAllByKey } from "./findAllByKeys";
import { getParsedMarketsGroupedByPair } from "./psyOptionMarketUtils";
import { getAccountInfo, getProgramAccounts } from "./solanaUtils";

export const getOpenInterest = async (
  optionMarkets: ProgramAccount<TypeDef<IdlTypeDef, IdlTypes<Idl>>>[]
) => {
  // ALL MARKETS GROUPED BY PAIR
  const optionMarketsByPair = await getParsedMarketsGroupedByPair(
    optionMarkets
  );
  const markets = await getOpenInterestFromPair(optionMarketsByPair);
  return markets;
};

export const getOpenInterestFromPair = async (
  optionMarketsByPair: ProgramAccount<TypeDef<IdlTypeDef, IdlTypes<Idl>>>[]
) => {
  let markets: any = {};
  for (const marketPair in optionMarketsByPair) {
    // 1 PAIR GROUPED BY EXPIRATION
    const marketsByExpiration: any = await groupMarketsByExpiration(
      optionMarketsByPair[marketPair]
    );
    let mp = marketPair.split("/");
    const strippedMarketsByExpiration: any = {};
    if (mp.includes("USDC")) {
      // ignores unkown / unknown pair
      let type;
      if (mp[0] === "USDC") {
        type = "put";
      } else {
        type = "call";
      }

      for (const marketExp in marketsByExpiration) {
        let marketExpMarkets: any = {};
        for (const market of marketsByExpiration[marketExp]) {
          // 1 PAIR 1 EXPIRATION WITH KEY INFO
          const data = await getStrikePriceAndTokenAmount(market);
          if (data) {
            if (type === "call") {
              if (marketExpMarkets[data.strikePrice]) {
                let newCalls =
                  data.calls + marketExpMarkets[data.strikePrice].calls;
                marketExpMarkets[data.strikePrice] = {
                  calls: newCalls,
                  puts: 0,
                };
              } else {
                marketExpMarkets[data.strikePrice] = {
                  calls: data.calls,
                  puts: 0,
                };
              }
            } else {
              if (marketExpMarkets[data.strikePrice]) {
                let newPuts =
                  data.puts + marketExpMarkets[data.strikePrice].puts;
                marketExpMarkets[data.strikePrice] = {
                  calls: 0,
                  puts: newPuts,
                };
              } else {
                marketExpMarkets[data.strikePrice] = {
                  calls: 0,
                  puts: data.puts,
                };
              }
            }
          }
        }
        strippedMarketsByExpiration[marketExp] = marketExpMarkets;
      }

      if (type === "put") {
        let revPair = mp[1] + "/" + mp[0];
        if (markets[revPair]) {
          for (const exp in strippedMarketsByExpiration) {
            if (markets[revPair][exp]) {
              for (const strike in strippedMarketsByExpiration[exp]) {
                if (markets[revPair][exp][strike]) {
                  if (markets[revPair][exp][strike]["calls"]) {
                    markets[revPair][exp][strike] = {
                      calls: markets[revPair][exp][strike]["calls"],
                      puts: strippedMarketsByExpiration[exp][strike]["puts"],
                    };
                  } else {
                    markets[revPair][exp][strike] = {
                      calls: 0,
                      puts: strippedMarketsByExpiration[exp][strike]["puts"],
                    };
                  }
                  markets[revPair][exp][strike]["puts"] =
                    strippedMarketsByExpiration[exp][strike]["puts"];
                } else {
                  markets[revPair][exp][strike] =
                    strippedMarketsByExpiration[exp][strike];
                }
              }
            } else {
              markets[revPair][exp] = strippedMarketsByExpiration[exp];
            }
          }
        } else {
          markets[revPair] = strippedMarketsByExpiration;
        }
      } else {
        if (markets[marketPair]) {
          for (const exp in strippedMarketsByExpiration) {
            if (markets[marketPair][exp]) {
              for (const strike in strippedMarketsByExpiration[exp]) {
                if (markets[marketPair][exp][strike]) {
                  if (markets[marketPair][exp][strike]["puts"]) {
                    markets[marketPair][exp][strike] = {
                      puts: markets[marketPair][exp][strike]["puts"],
                      calls: strippedMarketsByExpiration[exp][strike]["calls"],
                    };
                  } else {
                    markets[marketPair][exp][strike] = {
                      puts: 0,
                      calls: strippedMarketsByExpiration[exp][strike]["calls"],
                    };
                  }
                } else {
                  markets[marketPair][exp][strike] =
                    strippedMarketsByExpiration[exp][strike];
                }
              }
            } else {
              markets[marketPair][exp] = strippedMarketsByExpiration[exp];
            }
          }
        } else {
          markets[marketPair] = strippedMarketsByExpiration;
        }
      }
    }
  }
  console.log(markets);
  return markets;
};

const getStrikePriceAndTokenAmount = async (market: any) => {
  let strikePrice;
  if (market.quoteAssetMint && market.underlyingAssetMint) {
    if (market.quoteAssetMint.symbol === "USDC") {
      strikePrice = market.quoteAmountPerContract;
      // GET CIRCULATION OF TOKEN
      const tokens = await getTokenCirculation(market);

      return { strikePrice, puts: tokens };
    } else if (market.underlyingAssetMint.symbol === "USDC") {
      strikePrice = market.underlyingAmountPerContract;
      // GET CIRCULATION OF TOKEN
      const tokens = await getTokenCirculation(market);

      return { strikePrice, calls: tokens };
    }
  }
  return;
};

const groupMarketsByExpiration = async (markets: any) => {
  let groupedMarkets: any = {};
  for (const market of markets) {
    if (groupedMarkets[market.expiration]) {
      groupedMarkets[market.expiration].push(market);
    } else {
      groupedMarkets[market.expiration] = [market];
    }
  }
  return groupedMarkets;
};

const getTokenCirculation = async (market: any) => {
  const optionMint = await getAccountInfo(new PublicKey(market.optionMint));

  const optionMintHolders = await getProgramAccounts(
    new PublicKey(market.optionMint)
  );
  let optionTokenCount = 0;
  for (const holder of optionMintHolders) {
    optionTokenCount += parseInt(holder.tokenAmount);
  }
  if (parseInt(optionMint.supply) === optionTokenCount) {
    return optionTokenCount;
  } else {
    console.error("option token supply does not match circulation");
  }
};

export const getExpiredData = (openActivePair: any, currentExpiry: any) => {
  // const openData: any = openActivePair[currentExpiry];
  let expiryData: any = Object.keys(openActivePair).map(function (key) {
    return {
      label: moment.unix(parseInt(key)).format("MM/DD"),
      calls: findAllByKey(openActivePair[key], "calls").reduce(
        (p: any, a: any) => p + a,
        0
      ),
      puts: findAllByKey(openActivePair[key], "puts").reduce(
        (p: any, a: any) => p + a,
        0
      ),
    };
  });

  expiryData = Object.values(
    expiryData.reduce((result: any, object: any) => {
      result[object.label] = result[object.label] || {
        label: object.label,
      };
      ["calls", "puts"].forEach(
        (key) =>
          (result[object.label][key] =
            (result[object.label][key] || 0) + object[key])
      );
      return result;
    }, Object.create(null))
  );
  expiryData = expiryData.filter((i: any) => i.calls || i.puts);
  return expiryData;
};
