import React, { useEffect, useState } from "react";
import LineChart from "../components/graphs/LineChart";
import BarChart from "../components/graphs/BarChart";
import PieChart from "../components/graphs/PieChart";

import retrieveHistory from "../data/historicaldata";
import { linedata } from "../data/linedata";

import { bardata } from "../data/bardata";
import { Responsive, WidthProvider } from "react-grid-layout";
import "../styles.css";
import openinterest from "../data/openInterest.json";
import btcVolume from "../data/btcVolume.json";

// Handles the responsive nature of the grid
const ResponsiveGridLayout = WidthProvider(Responsive);
// Determines the screen breakpoints for the columns
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 320 };
// How many columns are available at each breakpoint
const cols = { lg: 4, md: 4, sm: 1, xs: 1, xxs: 1 };
const optionBars = ["calls", "puts"];
const openData: any = openinterest["BTC/USDC"]["1645776000"];
let shapedData = Object.keys(openData).map(function (key) {
  return {
    label: key.substring(0, 5),
    calls: openData[key]["calls"],
    puts: openData[key]["puts"],
  };
});
const sol = "solana";

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
const tvl = Object.values(btcVolume).reduce(
  (acc, curr) => (acc = acc + curr.tvlUsd),
  0
);
console.log(volume7);
console.log(volume24);
console.log(trades7);
console.log(trades24);
console.log(tvl);

const dataVolume = [
  { label: "24hr", volume: Math.floor(volume24) },
  { label: "7d", volume: Math.floor(volume7) },
];

const dataTrades = [
  { label: "24hr", trades: trades24 },
  { label: "7d", trades: trades7 },
];

export default function App() {
  const [solanaPrice, setSolanaPrice] = useState<any>();
  const [historicData, setHistoricData] = useState<any>();
  useEffect(() => {
    async function fetchSolanaPrice() {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${sol}&vs_currencies=usd`
      );
      if (res) {
        const json = await res.json();
        setSolanaPrice(json.solana.usd);
      }
    }
    fetchSolanaPrice();
    const interval = setInterval(() => {
      fetchSolanaPrice();
    }, 100000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function getPrices() {
      const prices = await retrieveHistory(sol);
      const pp = {
        id: "price",
        color: "#91ffd7",
        data: prices,
      };
      setHistoricData(pp);
    }
    getPrices();
  }, []);
  console.log(historicData);
  return (
    <div>
      <div className="w-full pb-5 px-5 ">
        <div className="btn hover:cursor-pointer mb-3 px-5">BTC/USDC</div>
        <ResponsiveGridLayout
          className="mx-8"
          breakpoints={breakpoints}
          cols={cols}
        >
          <div
            className="grid-cell"
            key="1"
            data-grid={{ x: 0, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Sol Price: ${solanaPrice}</h3>
            {historicData ? (
              <LineChart data={[historicData]} legend="Day" />
            ) : null}
          </div>

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
            <PieChart data />
          </div>

          <div
            className="grid-cell"
            key="5"
            data-grid={{ x: 0, y: 2, w: 2, h: 3, static: true }}
          >
            <h3 className="grid-header">Open Interest by Strike Price</h3>
            <BarChart data={shapedData} keys={optionBars} group={true} layout />
          </div>

          <div
            className="grid-cell"
            key="6"
            data-grid={{ x: 2, y: 2, w: 2, h: 3, static: true }}
          >
            <h3 className="grid-header">Historical Volume vs Open Interest</h3>
            <LineChart data={linedata} legend="Month" />
          </div>
          <div
            className="grid-cell"
            key="7"
            data-grid={{ x: 0, y: 5, w: 1, h: 2 }}
          >
            <h3 className="grid-header">Open Interest by Expiry</h3>
            <BarChart data={bardata} keys={["calls"]} group={null} layout />
          </div>
          <div
            className="grid-cell"
            key="8"
            data-grid={{ x: 2, y: 5, w: 3, h: 2 }}
          >
            <h3 className="grid-header">Historical Volatility</h3>
            <LineChart data={linedata} legend="" />
          </div>
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
