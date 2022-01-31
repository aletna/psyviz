import React, { useContext, useEffect, useState } from "react";
import LineChart from "../components/graphs/LineChart";
import BarChart from "../components/graphs/BarChart";
import PieChart from "../components/graphs/PieChart";

import retrieveHistory from "../data/historicaldata";
import { Responsive, WidthProvider } from "react-grid-layout";
import "../styles.css";
// import openinterest from "../data/openInterest.json";
import btcVolume from "../data/btcVolume.json";
import { OptionMarketContext } from "../components/context/OptionMarketContextInit";
import { CurrencyPairs, pairToCoinGecko } from "../utils/global";
import { findAllByKey } from "../utils/findAllByKeys";
import {
  getExpiredData,
  getOpenInterestFromPair,
} from "../utils/OpenInterestUtils";
import { combinePairDict } from "../utils/optionMarketUtils";
import ActivePairDropdown from "../components/ActivePairDropdown";

// Handles the responsive nature of the grid
const ResponsiveGridLayout = WidthProvider(Responsive);
// Determines the screen breakpoints for the columns
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 320 };
// How many columns are available at each breakpoint
const cols = { lg: 4, md: 4, sm: 1, xs: 1, xxs: 1 };
const optionBars = ["calls", "puts"];

const volume7 = Object.values(btcVolume).reduce(
  (acc, curr) => (acc = acc + curr.vol7d),
  0
);
const volume24 = Object.values(btcVolume).reduce(
  (acc, curr) => (acc = acc + curr.vol24h),
  0
);
const trades7 = Object.values(btcVolume).reduce(
  (acc, curr) => (acc = acc + curr.trades7d),
  0
);
const trades24 = Object.values(btcVolume).reduce(
  (acc, curr) => (acc = acc + curr.trades24h),
  0
);
// const tvl = Object.values(btcVolume).reduce(
//   (acc, curr) => (acc = acc + curr.tvlUsd),
//   0
// );

const dataVolume = [
  { label: "24hr", volume: Math.floor(volume24) },
  { label: "7d", volume: Math.floor(volume7) },
];

const dataTrades = [
  { label: "24hr", trades: trades24 },
  { label: "7d", trades: trades7 },
];

export default function App() {
  const [currencyPrice, setCurrencyPrice] = useState<any>();
  const [historicData, setHistoricData] = useState<any>();
  const [shapedData, setShapedData] = useState<any>();
  const [expiryData, setExpiryData] = useState<any>();
  const [openCalls, setOpenCalls] = useState<any>();
  const [openPuts, setOpenPuts] = useState<any>();
  const [activePair, setActivePair] = useState<string>(CurrencyPairs.BTC_USDC);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentExpiry, setCurrentExpiry] = useState<any>();
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

      const expiryData = getExpiredData(openActivePair, currentExpiry);

      setExpiryData(expiryData);

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

      console.log(tempo);
      //tempo = Object.entries(tempo).map(e => e[1])
      //tempo = tempo.filter((i) => i.calls || i.puts);
      Object.entries(tempo).forEach(([k, v]: any) => {
        if (v.calls === 0 && v.puts === 0) {
          delete tempo[k];
        }
      });

      console.log(tempo);

      let shapedData = Object.keys(tempo).map(function (key) {
        return {
          label: key.slice(0, -4),
          calls: tempo[key].calls,
          puts: tempo[key].puts,
        };
      });
      console.log(shapedData);

      setShapedData(shapedData);

      setOpenCalls(openCalls);
      setOpenPuts(openPuts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionMarketContext.openInterest]);

  useEffect(() => {
    async function updateActivePair(pair: string) {
      let _singlePairOptionMarkets: any = combinePairDict(
        optionMarketContext.optionMarkets,
        pair
      );

      if (_singlePairOptionMarkets) {
        // TODO: MAKE GLOBAL CONTEXT:
        // setSinglePairOptionMarkets(_singlePairOptionMarkets);
        const openInterest: any = await getOpenInterestFromPair(
          _singlePairOptionMarkets
        );
        let newOpenInterest = { ...optionMarketContext.openInterest };
        newOpenInterest[pair] = openInterest[pair];
        optionMarketContext.updateOpenInterest(newOpenInterest);
        console.log(newOpenInterest);
      }
    }
    if (activePair && optionMarketContext.optionMarkets) {
      updateActivePair(activePair);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePair]);

  // // VOLUME DATA
  //   useEffect(() => {
  //     if (
  //       optionMarketContext.serumMarkets &&
  //       optionMarketContext.serumMarkets[activePair]
  //     ) {
  //       let serumMarketsToGetVolumeFrom = [];
  //       console.log("HEEEEE --------------", optionMarketContext.serumMarkets);
  //       // get optionMarkets with same expiry
  //       for (const oms in optionMarketContext.optionMarkets) {
  //         for (const om of optionMarketContext.optionMarkets[oms]) {
  //           if (om.expiration === currentExpiry) {
  //             if (
  //               optionMarketContext.serumMarkets[activePair][om.optionMarketKey]
  //             ) {
  //               serumMarketsToGetVolumeFrom.push(
  //                 optionMarketContext.serumMarkets[activePair][om.optionMarketKey]
  //                   .serumMarketAddress
  //               );
  //             }
  //           }
  //         }
  //       }

  //       //   getBiweekVol(serumMarketsToGetVolumeFrom);
  //     }
  //   }, [optionMarketContext.serumMarkets, currentExpiry]);

  //   const getBiweekVol = async (addresses: string[]) => {
  //     const aggregatedData = [];
  //     for (const address of addresses) {
  //       const data = await getBiweekVolume(address);
  //       console.log(data);

  //       const extractedVolume = data.map((p: any) => {
  //         return {
  //           x: p.interval.split("T")[0].split("2022-")[1],
  //           y: p.volume.slice(0, -9), // is decimal correct??
  //         };
  //       });

  //       const volumeWeeks = [
  //         {
  //           id: "volume",
  //           color: "#91ffd7",
  //           data: extractedVolume,
  //         },
  //       ];
  //       const extractedTrades = data.map((p: any) => {
  //         return {
  //           x: p.interval.split("T")[0].split("2022-")[1],
  //           y: p.trades,
  //         };
  //       });

  //       const tradesWeeks = [
  //         {
  //           id: "volume",
  //           color: "#91ffd7",
  //           data: extractedTrades,
  //         },
  //       ];

  //       // setBiweeklyVolume(volumeWeeks);
  //       // setBiweeklyTrades(tradesWeeks); #

  //       //   console.log(address, volumeWeeks, tradesWeeks);
  //     }
  //   };

  return (
    <div>
      <div className="w-full pb-5 px-5 ">
        <div className="flex">
          <ActivePairDropdown
            activePair={activePair}
            setActivePair={setActivePair}
          />
        </div>

        <ResponsiveGridLayout
          className="mx-8"
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
            <BarChart
              data={dataVolume}
              keys={["volume"]}
              group={null}
              layout="horizontal"
            />
          </div>

          <div
            className="grid-cell"
            key="3"
            data-grid={{ x: 2, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Trade Metrics</h3>
            <BarChart
              data={dataTrades}
              keys={["trades"]}
              group={null}
              layout="horizontal"
            />
          </div>

          <div
            className="grid-cell"
            key="4"
            data-grid={{ x: 3, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Call/Put Ratio</h3>
            <PieChart data={[openCalls, openPuts]} />
          </div>

          <div
            className="grid-cell"
            key="5"
            data-grid={{ x: 0, y: 2, w: 2, h: 3, static: true }}
          >
            <h3 className="grid-header">Open Interest by Strike Price</h3>
            <BarChart
              data={shapedData}
              keys={optionBars}
              group={true}
              layout="vertical"
            />
          </div>

          {biweeklyVolume && (
            <div
              className="grid-cell"
              key="6"
              data-grid={{ x: 2, y: 2, w: 2, h: 3, static: true }}
            >
              <h3 className="grid-header">Daily Volume</h3>
              <LineChart data={biweeklyVolume} legend="Day" />
            </div>
          )}

          <div
            className="grid-cell"
            key="7"
            data-grid={{ x: 0, y: 5, w: 1, h: 2 }}
          >
            <h3 className="grid-header">Open Interest by Expiry</h3>
            <BarChart data={expiryData} keys={optionBars} layout group />
          </div>

          {biweeklyTrades && (
            <div
              className="grid-cell"
              key="8"
              data-grid={{ x: 2, y: 5, w: 3, h: 2 }}
            >
              <h3 className="grid-header">2 Week Trades</h3>
              <LineChart data={biweeklyTrades} legend="Day" />
            </div>
          )}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
