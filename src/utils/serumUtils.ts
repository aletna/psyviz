import { PublicKey } from "@solana/web3.js";
import { Market, Orderbook } from "@project-serum/serum";
import { connection, SERUM_DEX_V3, textEncoder } from "./global";

export const getSerumAddressAndMarketData = async (
  programId: PublicKey,
  optionMarketKey: PublicKey,
  priceCurrencyKey1: PublicKey,
  priceCurrencyKey2: PublicKey
) => {
  const [serumAddress1] = await deriveSerumMarketAddress(
    programId,
    optionMarketKey,
    priceCurrencyKey1
  );
  const [serumAddress2] = await deriveSerumMarketAddress(
    programId,
    optionMarketKey,
    priceCurrencyKey2
  );

  // TRY FOR EACH TO SEE IF MARKET EXISTS!
  let marketData = await getSerumMarketData(
    serumAddress1,
    optionMarketKey.toBase58()
  );
  if (!marketData) {
    marketData = await getSerumMarketData(
      serumAddress2,
      optionMarketKey.toBase58()
    );
  }
  if (marketData) {
    return marketData;
  }
};

export const getSerumMarketData = async (
  marketAddress: PublicKey,
  optionMarketKey?: string
) => {
  try {
    const market = await getSerumMarket(marketAddress);

    if (market) {
      const marketData = await _getSerumMarketData(market);

      let fullMarketData = {
        ...marketData,
        serumMarketAddress: marketAddress.toBase58(),
        optionMarketAddress: optionMarketKey ? optionMarketKey : undefined,
      };

      return fullMarketData;
    }
  } catch {
    // it's likely that no market exists
    return;
  }
  // }
};

export const deriveSerumMarketAddress = async (
  programId: PublicKey,
  optionMarketKey: PublicKey,
  priceCurrencyKey: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [
      optionMarketKey.toBuffer(),
      priceCurrencyKey.toBuffer(),
      textEncoder.encode("serumMarket"),
    ],
    programId
  );
};

export const getSerumMarket = async (marketAddress: PublicKey) => {
  let programAddress = SERUM_DEX_V3;
  let market = await Market.load(connection, marketAddress, {}, programAddress);

  if (market) {
    return market;
  } else return;
};

const _getSerumMarketData = async (market: Market) => {
  const baseMintAddress = market.baseMintAddress.toBase58();
  const quoteMintAddress = market.quoteMintAddress.toBase58();

  // orderbook tree
  const asksAddress = market.asksAddress.toBase58();
  const bidsAddress = market.bidsAddress.toBase58();

  // circular buffer (FIFO queue)
  //   event queue..
  // const eventQueue = await market.loadEventQueue(connection);

  // const fills = await market.loadFills(connection, 20);

  // const newFills = [];
  // if (fills.length > 0) {
  //   for (const fill of fills) {
  //     const f = fill;
  //     f.nativeQuantityPaid = f.nativeQuantityPaid.toString();
  //     f.nativeFeeOrRebate = f.nativeFeeOrRebate.toString();
  //     f.nativeQuantityReleased = f.nativeQuantityReleased.toString();
  //     newFills.push(f);
  //   }
  // }

  const asks = await market.loadAsks(connection);
  const bids = await market.loadBids(connection);
  // Full orderbook data
  const orderBook = await getOrderBookData(asks, bids);

  console.log('CLEAN ORDERBOOK DATA', orderBook);
  

  return {
    baseMintAddress,
    quoteMintAddress,
    asksAddress,
    bidsAddress,
    // eventQueue,
    orderBook,
    // fills: newFills,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getOrderBookData = async (asks: Orderbook, bids: Orderbook) => {
  const orderBook = [];
  //@ts-ignore
  for (let order of asks) {
    // const oo = await getOpenOrders(order.openOrdersAddress.toBase58());
    orderBook.push({
      orderId: order.orderId,
      price: order.price,
      priceLots: order.priceLots,
      size: order.size,
      feeTier: order.feeTier,
      openOrdersAddress: order.openOrdersAddress.toBase58(),
      openOrdersSlot: order.openOrdersSlot,
      side: order.side, // 'buy' or 'sell'
      // openOrders: oo,
    });
  }
  //@ts-ignore
  for (let order of bids) {
    // const oo = await getOpenOrders(order.openOrdersAddress.toBase58());
    orderBook.push({
      orderId: order.orderId,
      price: order.price,
      priceLots: order.priceLots,
      size: order.size,
      feeTier: order.feeTier,
      openOrdersAddress: order.openOrdersAddress.toBase58(),
      openOrdersSlot: order.openOrdersSlot,
      side: order.side, // 'buy' or 'sell'
      // openOrders: oo,
    });
  }

  return orderBook;
};

export const getDailyStatsAndVolume = async (address: string) => {
  const data = JSON.stringify({
    query: `
    query {
        dailyStats(markets: "${address}") {
          stats {
            vol7dUsd
            vol24hUsd
            trades24h
            trades7d
          }
          volume {
            volume
            trades
            interval
          }
        }
    } `,
    variables: `{
          "address": "${address}"
        }`,
  });

  const response = await fetch("https://api.serum.markets/", {
    method: "post",
    body: data,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  let json;
  if (response) {
    json = await response.json();
  }
  let allStats: any = {};

  if (json.data && json.data.dailyStats) {
    if (json.data.dailyStats.volume) {
      allStats["volume"] = json.data.dailyStats.volume;
    }
    if (json.data.dailyStats.stats) {
      let stats = {
        ...json.data.dailyStats.stats,
        vol7dUsd: json.data.dailyStats.stats.vol7dUsd
          ? parseInt(json.data.dailyStats.stats.vol7dUsd) / 10 ** 5
          : 0,
        vol24hUsd: json.data.dailyStats.stats.vol24hUsd
          ? parseInt(json.data.dailyStats.stats.vol24hUsd) / 10 ** 5
          : 0,
      };
      allStats["stats"] = stats;
    }
    return allStats;
  }
  return;
};

export const fetchCurrentSerumMarkets = async (
  currentSerumMarkets: any,
  singlePairOptionMarkets: any,
  programId: any,
  activePair: any
) => {
  let _serumData: any = {};
  const splitPair = activePair.split("/");
  const revPair = splitPair[1] + "/" + splitPair[0];
  if (
    singlePairOptionMarkets &&
    (singlePairOptionMarkets[activePair] || singlePairOptionMarkets[revPair])
  ) {
    let om;
    if (
      singlePairOptionMarkets[activePair] &&
      singlePairOptionMarkets[revPair]
    ) {
      om = singlePairOptionMarkets[activePair].concat(
        singlePairOptionMarkets[revPair]
      );
    } else if (singlePairOptionMarkets[activePair]) {
      om = singlePairOptionMarkets[activePair];
    } else if (singlePairOptionMarkets[revPair]) {
      om = singlePairOptionMarkets[revPair];
    }
    if (om) {
      for (const m in om) {
        const sd = await getSerum(om[m], programId);

        if (sd && sd.optionMarketAddress && sd.serumMarketAddress) {
          _serumData[sd.optionMarketAddress] = sd;
        }
      }

      let _serumMarkets = {
        ...currentSerumMarkets,
        [activePair]: _serumData,
      };
      return _serumMarkets;
    }
  }
};

const getSerum = async (m: any, programId: any) => {
  if (programId) {
    const data = await getSerumAddressAndMarketData(
      programId,
      new PublicKey(m.optionMarketKey),
      new PublicKey(m.quoteAssetMint.mint),
      new PublicKey(m.underlyingAssetMint.mint)
    );
    return data;
  }
};
