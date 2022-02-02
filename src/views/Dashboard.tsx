import React, { useContext, useEffect, useState } from "react";

import retrieveHistory from "../data/historicaldata";
import "../styles.css";
import { OptionMarketContext } from "../components/context/OptionMarketContextInit";
import {
  CurrencyPairs,
  dynamicDateSort,
  pairToCoinGecko,
} from "../utils/global";
import { findAllByKey } from "../utils/findAllByKeys";
import {
  getExpiredData2,
  getFormattedOpenActivePair,
  getOpenInterestFromPair2,
  getStrikeData,
  getTotalTVL,
} from "../utils/OpenInterestUtils";
import { combinePairDict } from "../utils/optionMarketUtils";
import {
  fetchCurrentSerumMarkets,
  getDailyStatsAndVolume,
} from "../utils/serumUtils";
import { useProgram } from "../hooks/useProgram";
import Navbar from "../components/layout/Navbar";
import ResponsiveGridComponent from "../components/ResponsiveGridComponent";
import Stats from "../components/Stats/Stats";
import ProgressBar from "../components/layout/ProgressBar";

export default function App() {
  const [currencyPrice, setCurrencyPrice] = useState<number>();
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
  const [putMarketCount, setPutMarketCount] = useState(-1);
  const [callMarketCount, setCallMarketCount] = useState(-1);

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

  useEffect(() => {
    if (optionMarketContext.singlePairOptionMarkets) {
      console.log(optionMarketContext.singlePairOptionMarkets);
      let putMarkets, callMarkets;
      for (const pair in optionMarketContext.singlePairOptionMarkets) {
        if (pair.split("/")[0] === "USDC") {
          putMarkets = optionMarketContext.singlePairOptionMarkets[pair].length;
        } else {
          callMarkets =
            optionMarketContext.singlePairOptionMarkets[pair].length;
        }
      }
      setPutMarketCount(putMarkets);
      setCallMarketCount(callMarkets);
      console.log(putMarkets, callMarkets);
    }
  }, [optionMarketContext.singlePairOptionMarkets]);

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
      const totalValue = getTotalTVL(
        optionMarketContext.singlePairOptionMarkets,
        currencyPrice
      );
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
      // OPEN CALLS & PUTS
      const openCalls = findAllByKey(openActivePair, "calls").reduce(
        (partialSum: any, a: any) => partialSum + a,
        0
      );
      const openPuts = findAllByKey(openActivePair, "puts").reduce(
        (partialSum: any, a: any) => partialSum + a,
        0
      );
      setOpenCalls(openCalls);
      setOpenPuts(openPuts);

      // EXPIRY DATA
      const formattedOpenActivePair =
        getFormattedOpenActivePair(openActivePair);

      let expiryData = getExpiredData2(formattedOpenActivePair);
      setExpiryData(expiryData);
      setOIELoading(false);

      // STIKE PRICE DATA
      const shapedData = getStrikeData(openActivePair);

      setShapedData(shapedData);
      setOISPLoading(false);

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
        const openInterest: any = await getOpenInterestFromPair2(
          _singlePairOptionMarkets,
          pair
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
      console.log("filtered orderbook", filteredOrderBook);
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
    console.log("SEEEEEEEE------EEEERUM", aggregatedVolume);

    setSerumLoadProgress({});
    getDailySerumStats(aggregatedStats);
    if (aggregatedVolume.length > 0) {
      getBiweekVol(aggregatedVolume);
    } else {
      setDVLoading(false);
      setDTLoading(false);
      setBiweeklyVolume([
        {
          id: "volume",
          color: "#91ffd7",
          data: [{ x: "0", y: 0 }],
        },
      ]);
      setBiweeklyTrades([
        {
          id: "volume",
          color: "#91ffd7",
          data: [{ x: "0", y: 0 }],
        },
      ]);
    }
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
      console.log("THHHHEEE VOLUME WEEKS", volumeWeeks);

      setBiweeklyVolume(volumeWeeks);
      setBiweeklyTrades(tradesWeeks);
    }
  };

  return (
    <div style={{ maxWidth: "3000px" }} className="mx-auto">
      <div>
        <Navbar
          title="PsyOptions Dashboard"
          activePair={activePair}
          setActivePair={setActivePair}
        />
      </div>
      <ProgressBar serumLoadProgress={serumLoadProgress} />
      <div className="w-full pb-5 px-5 ">
        <Stats
          activePair={activePair}
          TVL={TVL}
          openCalls={openCalls}
          openPuts={openPuts}
          callMarketCount={callMarketCount}
          putMarketCount={putMarketCount}
        />

        <ResponsiveGridComponent
          activePair={activePair}
          currencyPrice={currencyPrice}
          historicData={historicData}
          dataVolume={dataVolume}
          VMLoading={VMLoading}
          dataTrades={dataTrades}
          TMLoading={TMLoading}
          openCalls={openCalls}
          openPuts={openPuts}
          OICLoading={OICLoading}
          shapedData={shapedData}
          OISPLoading={OISPLoading}
          biweeklyVolume={biweeklyVolume}
          DVLoading={DVLoading}
          expiryData={expiryData}
          OIELoading={OIELoading}
          biweeklyTrades={biweeklyTrades}
          DTLoading={DTLoading}
        />

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
