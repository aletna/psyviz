import React, { useContext, useEffect, useState } from "react";
import LineChart from "../components/graphs/LineChart";
import BarChart from "../components/graphs/BarChart";
import PieChart from "../components/graphs/PieChart";

import retrieveHistory from "../data/historicaldata";
import { Responsive, WidthProvider } from "react-grid-layout";
import "../styles.css";
import { OptionMarketContext } from "../components/context/OptionMarketContextInit";
import {
  capitalizeFirstLetter,
  CurrencyPairs,
  dynamicDateSort,
  pairToCoinGecko,
} from "../utils/global";
import { findAllByKey } from "../utils/findAllByKeys";
import {
  getExpiredData,
  getOpenInterestFromPair,
} from "../utils/OpenInterestUtils";
import { combinePairDict } from "../utils/optionMarketUtils";
import {
  fetchCurrentSerumMarkets,
  getDailyStatsAndVolume,
} from "../utils/serumUtils";
import { useProgram } from "../hooks/useProgram";
import CalendarChart from "../components/graphs/CalendarChart";
import Navbar from "../components/layout/Navbar";
import Stats from "../components/Stats";
import Skeleton from "../components/Skeleton";

// Handles the responsive nature of the grid
const ResponsiveGridLayout = WidthProvider(Responsive);
// Determines the screen breakpoints for the columns
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 320 };
// How many columns are available at each breakpoint
const cols = { lg: 4, md: 4, sm: 1, xs: 1, xxs: 1 };
const optionBars = ["calls", "puts"];

export default function App() {
  const [currencyPrice, setCurrencyPrice] = useState<any>();
  const [historicData, setHistoricData] = useState<any>();
  const [shapedData, setShapedData] = useState<any>();
  const [expiryData, setExpiryData] = useState<any>();
  const [openCalls, setOpenCalls] = useState<any>();
  const [openPuts, setOpenPuts] = useState<any>();
  const [dataVolume, setDataVolume] = useState<any>();
  const [dataTrades, setDataTrades] = useState<any>();
  const [calendarData, setCalendarData] = useState<any>();
  const [biweeklyVolume, setBiweeklyVolume] = useState<any>();
  const [biweeklyTrades, setBiweeklyTrades] = useState<any>();
  const [orderBook, setOrderBook] = useState<any>();
  const [serumLoadProgress, setSerumLoadProgress] = useState<any>({});
  const [TVL, setTVL] = useState(-1);

  const [activePair, setActivePair] = useState<string>(CurrencyPairs.BTC_USDC);

  const [OIELoading, setOIELoading] = useState<boolean>(true);
  const [OISPLoading, setOISPLoading] = useState<boolean>(true);
  const [OICLoading, setOICLoading] = useState<boolean>(true);
  const [DVLoading, setDVLoading] = useState<boolean>(true);
  const [DTLoading, setDTLoading] = useState<boolean>(true);
  const [CDLoading, setCDLoading] = useState<boolean>(true);
  const [VMLoading, setVMLoading] = useState<boolean>(true);
  const [TMLoading, setTMLoading] = useState<boolean>(true);

  const program = useProgram();

  const optionMarketContext = useContext(OptionMarketContext);

  // on load
  useEffect(() => {
    optionMarketContext.updateActivePair("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coingecko data
  useEffect(() => {
    async function fetchPrice(currency: string) {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`
      );
      if (res) {
        const json = await res.json();
        setCurrencyPrice(json[currency].usd);
      }
    }
    async function getPrices(currency: string) {
      const prices = await retrieveHistory(currency);
      const pp = {
        id: "price",
        color: "#91ffd7",
        data: prices,
      };
      setHistoricData(pp);
    }

    if (activePair) {
      const currency = pairToCoinGecko[activePair];
      fetchPrice(currency);
      getPrices(currency);
      const interval = setInterval(() => {
        fetchPrice(currency);
      }, 100000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [activePair]);

  useEffect(() => {
    if (currencyPrice && optionMarketContext.singlePairOptionMarkets) {
      console.log("CURRENCY PRICE USING", currencyPrice);
      let totalValue = 0;
      for (const marketSide in optionMarketContext.singlePairOptionMarkets) {
        for (const market of optionMarketContext.singlePairOptionMarkets[
          marketSide
        ]) {
          console.log("");
          let quoteValue;
          if (market.quoteAssetMint.symbol === "USDC") {
            quoteValue =
              market.quoteAssetPool.balance /
              10 ** market.quoteAssetPool.decimals;
          } else {
            quoteValue =
              (market.quoteAssetPool.balance /
                10 ** market.quoteAssetPool.decimals) *
              currencyPrice;
          }

          console.log(
            "quote:",
            market.quoteAssetPool,
            quoteValue,
            market.quoteAssetMint.symbol
          );
          totalValue += quoteValue;

          let underlyingValue;
          if (market.underlyingAssetMint.symbol === "USDC") {
            underlyingValue =
              market.underlyingAssetPool.balance /
              10 ** market.underlyingAssetPool.decimals;
          } else {
            underlyingValue =
              (market.underlyingAssetPool.balance /
                10 ** market.underlyingAssetPool.decimals) *
              currencyPrice;
          }
          console.log(
            "underlying:",
            market.underlyingAssetPool,
            underlyingValue,
            market.underlyingAssetMint.symbol
          );
          console.log("");
          totalValue += underlyingValue;
        }
      }
      console.log("TOTAL VALUE", totalValue);
      setTVL(totalValue);
    }
  }, [currencyPrice, optionMarketContext.singlePairOptionMarkets]);

  // OPEN INTEREST DATA
  useEffect(() => {
    if (
      optionMarketContext.openInterest &&
      optionMarketContext.openInterest[activePair]
    ) {
      const openActivePair = optionMarketContext.openInterest[activePair];

      const expiryData = getExpiredData(openActivePair);

      setExpiryData(expiryData);
      setOIELoading(false);

      const openCalls = findAllByKey(openActivePair, "calls").reduce(
        (partialSum: any, a: any) => partialSum + a,
        0
      );
      const openPuts = findAllByKey(openActivePair, "puts").reduce(
        (partialSum: any, a: any) => partialSum + a,
        0
      );

      let tempData = Object.entries(openActivePair).map(([k, v]) => v);

      let tempo: any = {};
      Object.entries(tempData).forEach(([k, map2]: any) => {
        Object.entries(map2).forEach(([k2, v2]: any) => {
          if (k2 in tempo) {
            tempo[k2].calls += v2.calls;
            tempo[k2].puts += v2.puts;
          } else {
            tempo[k2] = v2;
          }
        });
      });

      Object.entries(tempo).forEach(([k, v]: any) => {
        if (v.calls === 0 && v.puts === 0) {
          delete tempo[k];
        }
      });

      tempo = Object.keys(tempo)
        .sort()
        .reduce((obj: any, key) => {
          obj[key] = tempo[key];
          return obj;
        }, {});

      let shapedData = Object.keys(tempo).map(function (key) {
        return {
          label: key.slice(0, -4),
          calls: tempo[key].calls,
          puts: tempo[key].puts,
        };
      });

      setShapedData(shapedData);
      setOISPLoading(false);

      setOpenCalls(openCalls);
      setOpenPuts(openPuts);
      setOICLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionMarketContext.openInterest]);

  // UPDATE ACTIVE PAIR
  useEffect(() => {
    async function updateActivePair(pair: string) {
      setOIELoading(true);
      setOISPLoading(true);
      setOICLoading(true);
      setDVLoading(true);
      setDTLoading(true);
      setCDLoading(true);
      setVMLoading(true);
      setTMLoading(true);
      let _singlePairOptionMarkets: any = combinePairDict(
        optionMarketContext.optionMarkets,
        pair
      );

      if (_singlePairOptionMarkets) {
        optionMarketContext.updateSinglePairOptionMarkets(
          _singlePairOptionMarkets
        );
        const openInterest: any = await getOpenInterestFromPair(
          _singlePairOptionMarkets
        );
        let newOpenInterest = { ...optionMarketContext.openInterest };
        newOpenInterest[pair] = openInterest[pair];
        optionMarketContext.updateOpenInterest(newOpenInterest);
        if (optionMarketContext.serumMarkets) {
          fetchSerumData(
            _singlePairOptionMarkets,
            optionMarketContext.serumMarkets
          );
        } else {
          fetchSerumData(_singlePairOptionMarkets, {});
        }
      }
    }
    if (activePair && optionMarketContext.optionMarkets) {
      updateActivePair(activePair);
      console.log("YES switching.....");
    } else {
      console.log("NO switching.....");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePair]);

  // TODO: ORDERBOOKDATA
  useEffect(() => {
    if (
      optionMarketContext.serumMarkets &&
      optionMarketContext.serumMarkets[activePair]
    ) {
      let filteredOrderBook = [];
      for (const market in optionMarketContext.serumMarkets[activePair]) {
        const _orderBook =
          optionMarketContext.serumMarkets[activePair][market].orderBook;
        if (_orderBook && _orderBook.length > 0) {
          for (const ob of _orderBook) {
            console.log(ob);
            console.log("");

            console.log("Price Lots:", ob.priceLots.toString());
            console.log("Price:", ob.price);
            console.log("Size:", ob.size);
            console.log("Side:", ob.side);
            console.log("");
            filteredOrderBook.push({
              priceLots: parseInt(ob.priceLots.toString()),
              price: ob.price,
              size: ob.size,
              side: ob.side,
            });
            setOrderBook(filteredOrderBook);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionMarketContext.serumMarkets]);

  useEffect(() => {
    if (orderBook) {
      console.log("THEEEEE order book:", orderBook);
    }
  }, [orderBook]);

  useEffect(() => {
    if (dataVolume && VMLoading) {
      setVMLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVolume]);

  useEffect(() => {
    if (dataTrades && TMLoading) {
      setTMLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataTrades]);

  useEffect(() => {
    if (calendarData && CDLoading) {
      setCDLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarData]);

  useEffect(() => {
    console.log("biweeklyVolume", biweeklyVolume);

    if (biweeklyVolume && DVLoading) {
      setDVLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biweeklyVolume]);

  useEffect(() => {
    if (biweeklyTrades && DTLoading) {
      setDTLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biweeklyTrades]);

  const fetchSerumData = async (
    singlePairOptionMarkets: any,
    serumMarkets: any
  ) => {
    if (optionMarketContext.singlePairOptionMarkets && program) {
      const _serumMarkets = await fetchCurrentSerumMarkets(
        serumMarkets,
        singlePairOptionMarkets,
        program.programId,
        activePair
      );
      optionMarketContext.updateSerumMarkets(_serumMarkets);
    }
  };

  // VOLUME DATA
  useEffect(() => {
    if (
      optionMarketContext.serumMarkets &&
      optionMarketContext.serumMarkets[activePair]
    ) {
      let serumMarketsToGetVolumeFrom = [];
      for (const oms in optionMarketContext.optionMarkets) {
        for (const om of optionMarketContext.optionMarkets[oms]) {
          if (
            optionMarketContext.serumMarkets[activePair][om.optionMarketKey]
          ) {
            serumMarketsToGetVolumeFrom.push(
              optionMarketContext.serumMarkets[activePair][om.optionMarketKey]
                .serumMarketAddress
            );
          }
        }
      }
      if (optionMarketContext.activePair !== activePair) {
        optionMarketContext.updateActivePair(activePair);
        getDailySerumStatsAndVol(serumMarketsToGetVolumeFrom);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionMarketContext.serumMarkets]);

  const getDailySerumStatsAndVol = async (addresses: string[]) => {
    const aggregatedStats: any = {};
    const aggregatedVolume: any[] = [];
    const n = addresses.length;
    setSerumLoadProgress({ n, curr: 1 });
    for (let i = 0; i < addresses.length; i += 1) {
      setSerumLoadProgress({ n, curr: i + 1 });
      const data = await getDailyStatsAndVolume(addresses[i]);
      if (data.stats) {
        aggregatedStats[addresses[i]] = data.stats;
      }
      if (data.volume) {
        data.volume.forEach((d: any) => aggregatedVolume.push(d));
      }
      // if (i > 0 && i % 8 === 0) {
      //   await delay(1000);
      // }
    }
    setSerumLoadProgress({});
    getDailySerumStats(aggregatedStats);
    getBiweekVol(aggregatedVolume);
  };

  const getDailySerumStats = async (aggregatedStats: any) => {
    const volume7: any = Object.values(aggregatedStats).reduce(
      (acc, curr: any) => (acc = acc + curr.vol7dUsd),
      0
    );
    const volume24: any = Object.values(aggregatedStats).reduce(
      (acc, curr: any) => (acc = acc + curr.vol24hUsd),
      0
    );
    const trades7 = Object.values(aggregatedStats).reduce(
      (acc, curr: any) => (acc = acc + curr.trades7d),
      0
    );
    const trades24 = Object.values(aggregatedStats).reduce(
      (acc, curr: any) => (acc = acc + curr.trades24h),
      0
    );

    const _dataVolume = [
      { label: "24hr", volume: Math.floor(volume24) },
      { label: "7d", volume: Math.floor(volume7) },
    ];

    const _dataTrades = [
      { label: "24hr", trades: trades24 },
      { label: "7d", trades: trades7 },
    ];

    setDataVolume(_dataVolume);
    setDataTrades(_dataTrades);
  };

  const getBiweekVol = async (aggregatedVolume: any[]) => {
    if (aggregatedVolume.length > 0) {
      const _calendarData = aggregatedVolume.map(function (key) {
        return {
          value: key.trades,
          day: key.interval.split("T")[0],
        };
      });

      setCalendarData(_calendarData);

      const mergedWeekVolume = aggregatedVolume.reduce((a, c) => {
        let x = a.find((e: any) => e.interval === c.interval);
        let obj = { ...c, volume: parseInt(c.volume) };
        if (!x) {
          a.push(Object.assign({}, obj));
        } else {
          x.volume += obj.volume;
          x.trades += obj.trades;
        }
        return a;
      }, []);

      mergedWeekVolume.sort(dynamicDateSort("interval"));

      const extractedVolume = mergedWeekVolume.map((p: any) => {
        return {
          x: p.interval.split("T")[0].split("2022-")[1],
          y: p.volume / 10 ** 5, // p.volume.slice(0, -9), // is decimal correct??
        };
      });

      const volumeWeeks = [
        {
          id: "volume",
          color: "#91ffd7",
          data: extractedVolume,
        },
      ];
      const extractedTrades = mergedWeekVolume.map((p: any) => {
        return {
          x: p.interval.split("T")[0].split("2022-")[1],
          y: p.trades,
        };
      });

      const tradesWeeks = [
        {
          id: "volume",
          color: "#91ffd7",
          data: extractedTrades,
        },
      ];

      setBiweeklyVolume(volumeWeeks);
      setBiweeklyTrades(tradesWeeks);
    }
  };

  return (
    <div>
      <div>
        <Navbar
          title="PsyOptions Dashboard"
          activePair={activePair}
          setActivePair={setActivePair}
        />
      </div>
      {serumLoadProgress.curr && (
        <div className="w-full ">
          <div className="px-7 mb-3 artboard">
            <progress
              className="progress progress-secondary"
              value={(serumLoadProgress.curr / serumLoadProgress.n) * 100}
              max="100"
            ></progress>
          </div>
        </div>
      )}
      <div className="w-full pb-5 px-5 ">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 mx-2">
          <Stats activePair={activePair} TVL={TVL} />
        </div>

        <ResponsiveGridLayout
          className=""
          breakpoints={breakpoints}
          cols={cols}
        >
          {activePair && (
            <div
              className="grid-cell"
              key="1"
              data-grid={{ x: 0, y: 0, w: 1, h: 2, static: true }}
            >
              <h3 className="grid-header">
                {capitalizeFirstLetter(pairToCoinGecko[activePair])} Price: $
                {currencyPrice && currencyPrice}
              </h3>

              {historicData ? (
                <LineChart data={[historicData]} legend="Day" axisLeft="USD" />
              ) : null}
            </div>
          )}
          <div
            className="grid-cell"
            key="2"
            data-grid={{ x: 1, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Serum Volume Metrics</h3>
            {dataVolume && !VMLoading ? (
              <>
                <BarChart
                  data={dataVolume}
                  keys={["volume"]}
                  group={"stacked"}
                  layout="horizontal"
                />
              </>
            ) : (
              <Skeleton />
            )}
          </div>
          <div
            className="grid-cell"
            key="3"
            data-grid={{ x: 2, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Serum Trade Metrics</h3>
            {dataTrades && !TMLoading ? (
              <>
                <BarChart
                  data={dataTrades}
                  keys={["trades"]}
                  group={"stacked"}
                  layout="horizontal"
                />
              </>
            ) : (
              <Skeleton />
            )}
          </div>
          <div
            className="grid-cell"
            key="4"
            data-grid={{ x: 3, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Call/Put Ratio</h3>
            {openCalls && openPuts && !OICLoading ? (
              <PieChart data={[openCalls, openPuts]} />
            ) : (
              <Skeleton />
            )}
          </div>
          <div
            className="grid-cell"
            key="5"
            data-grid={{ x: 0, y: 2, w: 2, h: 3, static: true }}
          >
            <h3 className="grid-header">Open Interest by Strike Price</h3>
            {shapedData && !OISPLoading ? (
              <BarChart
                data={shapedData}
                keys={optionBars}
                group="grouped"
                layout="vertical"
              />
            ) : (
              <Skeleton />
            )}
          </div>
          <div
            className="grid-cell"
            key="6"
            data-grid={{ x: 2, y: 2, w: 2, h: 3, static: true }}
          >
            <h3 className="grid-header">Serum Daily Volume</h3>
            {biweeklyVolume && !DVLoading ? (
              <LineChart data={biweeklyVolume} legend="Day" />
            ) : (
              <Skeleton />
            )}
          </div>
          <div
            className="grid-cell"
            key="7"
            data-grid={{ x: 0, y: 5, w: 1, h: 2 }}
          >
            <h3 className="grid-header">Open Interest by Expiry</h3>
            {expiryData && !OIELoading ? (
              <BarChart
                data={expiryData}
                keys={optionBars}
                layout="vertical"
                group="stacked"
              />
            ) : (
              <Skeleton />
            )}
          </div>
          <div
            className="grid-cell"
            key="8"
            data-grid={{ x: 1, y: 5, w: 1, h: 2 }}
          >
            <h3 className="grid-header">Serum Daily # of Trades</h3>
            {calendarData && !CDLoading ? (
              <CalendarChart data={calendarData} />
            ) : (
              <Skeleton />
            )}
          </div>
          <div
            className="grid-cell"
            key="9"
            data-grid={{ x: 3, y: 5, w: 2, h: 2 }}
          >
            <h3 className="grid-header">Serum Daily # of Trades</h3>

            {biweeklyTrades && !DTLoading ? (
              <LineChart data={biweeklyTrades} legend="Day" />
            ) : (
              <Skeleton />
            )}
          </div>
          )
        </ResponsiveGridLayout>
        {/* <div className="py-5">
          <h3 className="grid-header">OpenOrders</h3>
          <div className="flex">
            <div>
              {orderBook &&
                orderBook.map((order: any, key: number) => {
                  if (order.side === "buy") {
                    return (
                      <div key={key}>
                        {order.price} - {order.size}
                      </div>
                    );
                  }
                  return <></>;
                })}
            </div>
            <div>
              {orderBook &&
                orderBook.map((order: any, key: number) => {
                  if (order.side === "sell") {
                    return (
                      <div key={key}>
                        {order.price} - {order.size}
                      </div>
                    );
                  }
                  return <></>;
                })}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
