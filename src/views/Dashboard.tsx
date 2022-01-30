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

export default function App() {
  const [solo, setSolo] = useState<any>();
  const [historicData, setHistoricData] = useState<any>();
  const tst = async () => {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${sol}&vs_currencies=usd`
    );
    const json = await res.json();
    setSolo(json.solana.usd);
  };

  useEffect(() => {
    tst();
    const interval = setInterval(() => {
      tst();
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
      <div className="w-full p-5">
        <div className="flex justify-between items-center bg-gradient-to-r from-purple-500 to-pink-500 mb-5  p-5 shadow-lg rounded-lg">
          <h1 className="text-2xl text-red-50 ">PsyOptions Dashboard</h1>
        </div>
        <div className="btn hover:cursor-pointer mb-3">BTC/USDC</div>
        <ResponsiveGridLayout
          className=" mx-8"
          breakpoints={breakpoints}
          cols={cols}
        >
          <div
            className="grid-cell"
            key="1"
            data-grid={{ x: 0, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Sol Price: ${solo}</h3>
            {historicData ? (
              <LineChart data={[historicData]} legend="Day" />
            ) : null}
          </div>

          <div
            className="grid-cell"
            key="2"
            data-grid={{ x: 1, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">24h Metrics</h3>
            <BarChart data={shapedData} keys={optionBars} group={true} />
          </div>

          <div
            className="grid-cell"
            key="3"
            data-grid={{ x: 2, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">7D Metrics</h3>
            <BarChart data={shapedData} keys={optionBars} group={true} />
          </div>

          <div
            className="grid-cell"
            key="4"
            data-grid={{ x: 3, y: 0, w: 1, h: 2, static: true }}
          >
            <h3 className="grid-header">Call/Put Ratio</h3>
            <PieChart />
          </div>

          <div
            className="grid-cell"
            key="5"
            data-grid={{ x: 0, y: 2, w: 2, h: 3, static: true }}
          >
            <h3 className="grid-header">Open Interest by Strike Price</h3>
            <BarChart data={shapedData} keys={optionBars} group={true} />
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
            <BarChart data={bardata} keys={["calls"]} group={null} />
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
