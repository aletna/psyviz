import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import {
  getOptionMintHolders,
  getOptionMintInfo,
  getParsedOptionMarket,
  getSerumMarket,
} from "../utils/psyOptionMarketUtils";

import {
  gql,
} from "@apollo/client";

export default function OptionMarket(props: any) {
  const [optionMarket, setOptionMarket] = useState<any>();
  const [optionMintInfo, setOptionMintInfo] = useState<any>();
  const [optionMintHolders, setOptionMintHolders] = useState<any>();
  const [optionMintHoldersCount, setOptionMintHoldersCount] = useState<any>();
  const [serumMarketData, setSerumMarketData] = useState<any>();
  const [serumMarketKey, setSerumMarketKey] = useState<any>();
  const [serumgql, setserumgql] = useState<any>();
  const [GQLData, setGQLData] = useState<any>();
  useEffect(() => {
    getOptionMarket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.optionMarket]);

  const getOptionMarket = async () => {
    const _optionMarket = await getParsedOptionMarket(props.optionMarket);

    if (_optionMarket) {
      setOptionMarket(_optionMarket);
      const _optionMintInfo = await getOptionMintInfo(
        new PublicKey(_optionMarket.optionMint)
      );
      setOptionMintInfo(_optionMintInfo);

      const _optionMintHolders = await getOptionMintHolders(
        new PublicKey(_optionMarket.optionMint)
      );
      setOptionMintHolders(_optionMintHolders);

      // get active holders
      let _optionMintHoldersCount = 0;
      for (const holder of _optionMintHolders) {
        if (parseInt(holder.tokenAmount) > 0) {
          _optionMintHoldersCount += 1;
        }
      }
      if (_optionMintHoldersCount > 0) {
        setOptionMintHoldersCount(_optionMintHoldersCount);
      }

      if (_optionMarket.quoteAssetMint && _optionMarket.underlyingAssetMint) {
        const data = await getSerumMarket(
          props.programId,
          new PublicKey(_optionMarket.optionMarketKey),
          new PublicKey(_optionMarket.quoteAssetMint?.mint),
          new PublicKey(_optionMarket.underlyingAssetMint?.mint)
        );
        if (data) {
          console.log("aaaaaa", data[1], props.optionMarket.publicKey.toBase58());

          setSerumMarketData(data[0]);
          setSerumMarketKey(data[1]);
        }
      }
    }
  };

  useEffect(() => {
    if (serumMarketKey) {
      const SERUM = gql`
            {
                dailyStats(markets: "${serumMarketKey}") {
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
                    volume {
                        volume
                        trades
                        interval
                    }
                }
            }
        `;
      setserumgql(SERUM);
    }
  }, [serumMarketKey]);

  const handleSerumData = (data: any) => {
    if (data) {
      setGQLData(data);
    }
  };
  return (
    <div
      style={{ border: "2px solid lightblue", margin: "12px", padding: "12px" }}
    >
      <div>PK: {props.optionMarket.publicKey.toBase58()}</div>
      {optionMarket && (
        <>
          <div>Expiration: {optionMarket.expiration}</div>
          <div>
            Pair: {optionMarket.quoteAssetMint?.symbol}/
            {optionMarket.underlyingAssetMint?.symbol}
          </div>
          <div>
            underlyingAmountPerContract:{" "}
            {optionMarket.underlyingAmountPerContract}
          </div>
          <div>
            quoteAmountPerContract: {optionMarket.quoteAmountPerContract}
          </div>
        </>
      )}
      {optionMintInfo && (
        <div>
          Supply: {optionMintInfo.supply} ({optionMintInfo.decimals} decimals)
        </div>
      )}
      {optionMintHoldersCount && optionMintHoldersCount > 0 ? (
        <div>Unique Current Holders: {optionMintHoldersCount}</div>
      ) : (
        <div>Unique Current Holders: None</div>
      )}
      {optionMintHolders && optionMintHolders.length > 0 ? (
        <div>Unique All Time Holders: {optionMintHolders.length}</div>
      ) : (
        <div>Unique All Time Holders: None</div>
      )}
      {GQLData && (
        <div>
          <div>TRADES 7d: {GQLData.dailyStats.stats.trades7d}</div>
          <div>TRADES 24h: {GQLData.dailyStats.stats.trades24h}</div>
          <div>TRADES 1h: {GQLData.dailyStats.stats.trades1h}</div>

        </div>
      )}
    </div>
  );
}
