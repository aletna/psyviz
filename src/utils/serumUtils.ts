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
  const eventQueue = await market.loadEventQueue(connection);

  const asks = await market.loadAsks(connection);
  const bids = await market.loadBids(connection);

  const fills = await market.loadFills(connection, 20);

  const newFills = [];
  if (fills.length > 0) {
    for (const fill of fills) {
      const f = fill;
      f.nativeQuantityPaid = f.nativeQuantityPaid.toString();
      f.nativeFeeOrRebate = f.nativeFeeOrRebate.toString();
      f.nativeQuantityReleased = f.nativeQuantityReleased.toString();
      newFills.push(f);
    }
  }

  // Full orderbook data
  const orderBook = await getOrderBookData(asks, bids);

  return {
    baseMintAddress,
    quoteMintAddress,
    asksAddress,
    bidsAddress,
    eventQueue,
    orderBook,
    fills: newFills,
  };
};

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

export const getDailyStats = async (address: string) => {
  const data = JSON.stringify({
    query: `
    query {
        dailyStats(markets: "${address}") {
            stats {
                vol1hUsd
                vol24hUsd
                vol7dUsd
                trades1h
                trades24h
                trades7d
                tvlUsd
                au1h
                au24h
                au7d
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
      // 'Content-Length': data.length,
      // Authorization: 'Apikey ' + process.env.STEPZEN_API_KEY,
      // 'User-Agent': 'Node',
    },
  });

  const json = await response.json();
  console.log(json, address);
  return json;
};

export const getBiweekVolume = async (address: string) => {
  const data = JSON.stringify({
    query: `
    query {
        dailyStats(markets: "${address}") {
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
  if (json.data && json.data.dailyStats && json.data.dailyStats.volume) {
    return json.data.dailyStats.volume;
  }

  return;
};
