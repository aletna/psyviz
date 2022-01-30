import React from "react";
import { ResponsiveBar } from "@nivo/bar";

export default function BarChart({ data, keys, group }) {
  return (
    <>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy="label"
        groupMode={group ? "grouped" : undefined}
        margin={{ top: 30, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        colors={["#91f2ff", "#ffa1a1"]}
        legends={[
          {
            dataFrom: "keys",
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: "left-to-right",
            itemOpacity: 0.85,
            symbolSize: 20
          }
        ]}
        animate={true}
      />
    </>
  );
}