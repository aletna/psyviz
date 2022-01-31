import React, { useContext, useEffect, useState } from "react";
import LineChart from "../components/graphs/LineChart";
import BarChart from "../components/graphs/BarChart";
import PieChart from "../components/graphs/PieChart";

import retrieveHistory from "../data/historicaldata";
import { Responsive, WidthProvider } from "react-grid-layout";
import "../styles.css";
import { OptionMarketContext } from "../components/context/OptionMarketContextInit";
import {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [currentExpiry, setCurrentExpiry] = useState<any>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [biweeklyVolume, setBiweeklyVolume] = useState<any>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [biweeklyTrades, setBiweeklyTrades] = useState<any>();
  const optionMarketContext = useContext(OptionMarketContext);

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

  // OPEN INTEREST DATA
  useEffect(() => {
    if (
      optionMarketContext.openInterest &&
      optionMarketContext.openInterest[activePair]
    ) {
      console.log(">>> activepair", activePair);
      console.log(">>> optionMarkets", optionMarketContext.optionMarkets);

      console.log(optionMarketContext.openInterest);

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePair]);

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
      setDVLoading(false);
      setDTLoading(false);
      setCDLoading(false);
      setVMLoading(false);
      setTMLoading(false);
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
      console.log(serumMarketsToGetVolumeFrom);

      getDailySerumStatsAndVol(serumMarketsToGetVolumeFrom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionMarketContext.serumMarkets]);

  const getDailySerumStatsAndVol = async (addresses: string[]) => {
    const aggregatedStats: any = {};
    const aggregatedVolume: any[] = [];
    for (const address of addresses) {
      console.log(address);
      const data = await getDailyStatsAndVolume(address);
      if (data.stats) {
        aggregatedStats[address] = data.stats;
      }
      if (data.volume) {
        data.volume.forEach((d: any) => aggregatedVolume.push(d));
      }
    }

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

    console.log("volume7d", volume7);
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
    console.log("merged", _dataVolume, _dataTrades);
  };

  const getBiweekVol = async (aggregatedVolume: any[]) => {
    const _calendarData = aggregatedVolume.map(function (key) {
      console.log(":))))))))", key);

      return {
        value: key.trades,
        day: key.interval.split("T")[0],
      };
    });
    console.log("CAL", calendarData);

    setCalendarData(_calendarData);

    const mergedWeekVolume = aggregatedVolume.reduce((a, c) => {
      console.log("A", a);

      let x = a.find((e: any) => e.interval === c.interval);
      console.log("x", x);
      let obj = { ...c, volume: parseInt(c.volume) };
      if (!x) {
        a.push(Object.assign({}, obj));
      } else {
        x.volume += obj.volume;
        x.trades += obj.trades;
      }
      return a;
    }, []);

    console.log(mergedWeekVolume);
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
    console.log("volweeks", volumeWeeks);

    setBiweeklyVolume(volumeWeeks);
    setBiweeklyTrades(tradesWeeks);

    console.log(volumeWeeks, tradesWeeks);
  };

  return (
    <div>
      <div>
        <Navbar title="PsyOptions Dashboard" activePair={activePair} setActivePair={setActivePair}/>
      </div>
      <div className="w-full pb-5 px-5 ">
  

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
                {pairToCoinGecko[activePair]} Price: $
                {currencyPrice && currencyPrice}
              </h3>

              {historicData ? (
                <LineChart data={[historicData]} legend="Day" />
              ) : null}
            </div>
          )}
          <div
            className="grid-cell"
            key="2"
            data-grid={{ x: 1, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Volume Metrics</h3>
            {dataVolume && !VMLoading ? (
              <>
                <BarChart
                  data={dataVolume}
                  keys={["volume"]}
                  group={null}
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
            <h3 className="grid-header">Trade Metrics</h3>
            {dataTrades && !TMLoading ? (
              <>
                <BarChart
                  data={dataTrades}
                  keys={["trades"]}
                  group={null}
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
                group={true}
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
            <h3 className="grid-header">Daily Volume</h3>
            {biweeklyVolume && !DVLoading ? (
              <>
                {biweeklyVolume[0].data.length === 0 ? (
                  <div className="grid-text">
                    Oops, looks like there were no trades in the past 2 weeks.
                  </div>
                ) : (
                  <LineChart data={biweeklyVolume} legend="Day" />
                )}
              </>
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
                group
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
            <h3 className="grid-header">Daily # of Trades</h3>
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
            <h3 className="grid-header">Daily # of Trades</h3>

            {biweeklyTrades && !DTLoading ? (
              <>
                {biweeklyTrades[0].data.length === 0 ? (
                  <div className="grid-text">
                    Oops, looks like there were no trades in the past 2 weeks.
                  </div>
                ) : (
                  <LineChart data={biweeklyTrades} legend="Day" />
                )}
              </>
            ) : (
              <Skeleton />
            )}
          </div>
          )
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

const Skeleton = () => {
  return (
    <div className=" h-full p-5 w-full mx-auto animate-pulse pb-7 ">
      <div className="rounded-md animate-pulse flex bg-gray-200 h-full  w-full"></div>
    </div>
  );
};
