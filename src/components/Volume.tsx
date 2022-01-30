import { useEffect, useState } from "react";
import {
  deriveSerumMarketAddress,
  getDailyStats,
  getSerumAddressAndMarketData,
} from "../utils/serumUtils";

export default function Volume(props: any) {
  const [data, setData] = useState<any>();
  const [isSet, setIsSet] = useState(false);
  useEffect(() => {
    _getVolume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.optionMarkets]);

  const _getVolume = async () => {
    console.log(props.optionMarkets);

    const markets = [];
    for (const market of props.optionMarkets) {
      if (
        market.account.quoteAssetMint.toBase58() ===
          "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E" ||
        market.account.underlyingAssetMint.toBase58() ===
          "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E"
      ) {
        const m = await getSerumAddressAndMarketData(
          props.program.programId,
          market.publicKey,
          market.account.quoteAssetMint,
          market.account.underlyingAssetMint
        );

        if (m) {
          markets.push(m);
          console.log(m);
        }
      }
    }
    let error = false;
    let allStats: any = {};
    for (const market of markets) {
      try {
        const stats = await getDailyStats(market.marketAddress);
        if (stats) {
          const dailyStats = {
            trades1h: stats.data.dailyStats.stats.trades1h,
            trades24h: stats.data.dailyStats.stats.trades24h,
            trades7d: stats.data.dailyStats.stats.trades7d,
            vol1h: stats.data.dailyStats.stats.vol1hUsd / 10 ** 5,
            vol24h: stats.data.dailyStats.stats.vol24hUsd / 10 ** 5,
            vol7d: stats.data.dailyStats.stats.vol7dUsd / 10 ** 5,
            tvlUsd: stats.data.dailyStats.stats.tvlUsd / 10 ** 5,
          };

          if (allStats[market.marketAddress]) {
            console.log(
              "-------------- ALREADY EXISTS -------------- ",
              dailyStats,
              market
            );
          } else {
            allStats[market.marketAddress] = dailyStats;
          }
        }
      } catch (err) {
        console.log(">>>>>>>>>>>", err);
        error = true;
      }
    }
    console.log("RESULT:", allStats);
    console.log("MARKET LENGTH", markets.length);
    console.log("MARKET LENGTH", markets.length);
    if (!isSet) {
      setData(allStats);
      setIsSet(true);
    }
  };

  return (
    <div>
      {data && (
        <div>
          <div>
            {`-->`} {data.length} {`<--`}
          </div>
          <a
            href={`data:text/json;charset=utf-8,${encodeURIComponent(
              JSON.stringify(data)
            )}`}
            download="filename.json"
          >
            {`Download Json`}
          </a>
          {/* <FillsTable fills={psyData[0].fills} /> */}
        </div>
      )}
    </div>
  );
}
