import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { createContext, useState } from "react";
import { ReactNode, useContext, useEffect } from "react";
import { useProgram } from "../../hooks/useProgram";
import { getOpenInterestFromPair } from "../../utils/OpenInterestUtils";
import { combinePairDict } from "../../utils/optionMarketUtils";
import {
  getAllOpenPsyOptionMarkets,
  getParsedMarketsGroupedByPair,
} from "../../utils/psyOptionMarketUtils";
import { getSerumAddressAndMarketData } from "../../utils/serumUtils";
import { getTokenDict } from "../../utils/tokenUtls";

interface OptionMarketContextProps {
  optionMarkets: any;
  updateOptionMarkets: (_optionMarkets: any) => void;
  openInterest: any;
  updateOpenInterest: (_openInterest: any) => void;
  tokenDict: any;
  updateTokenDict: (_tokenDict: any) => void;
  serumMarkets: any;
  updateSerumMarkets: (_serumMarkets: any) => void;
}

export const OptionMarketContext = createContext<OptionMarketContextProps>({
  optionMarkets: {},
  updateOptionMarkets: (_optionMarkets: any) => {},
  openInterest: {},
  updateOpenInterest: (_openInterest: any) => {},
  tokenDict: {},
  updateTokenDict: (_tokenDict: any) => {},
  serumMarkets: {},
  updateSerumMarkets: (_serumMarkets: any) => {},
});

export const OptionMarketContextConsumer = OptionMarketContext.Consumer;
export const OptionMarketContextProvider = OptionMarketContext.Provider;

type Props = {
  children?: ReactNode;
};

const OptionMarketContextInit = ({ children }: Props) => {
  const optionMarketContext = useContext(OptionMarketContext);
  const [singlePairOptionMarkets, setSinglePairOptionMarkets] = useState<any>();
  const program = useProgram();

  useEffect(() => {
    if (program) {
      fetchTokenDict();
      fetchAllOpenOptionMarkets(program);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program]);

  useEffect(() => {
    if (singlePairOptionMarkets) {
      fetchSerumData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singlePairOptionMarkets]);

  const fetchTokenDict = async () => {
    const _tokenDict = await getTokenDict();
    optionMarketContext.updateTokenDict(_tokenDict);
  };

  const fetchAllOpenOptionMarkets = async (program: Program) => {
    const _optionMarkets = await getAllOpenPsyOptionMarkets(program);
    console.log(_optionMarkets);
  
    const _optionMarketsByPair = await getParsedMarketsGroupedByPair(
      _optionMarkets
    );

    optionMarketContext.updateOptionMarkets(_optionMarketsByPair);
    fetchOpenInterestForPair(_optionMarketsByPair);
  };

  const fetchOpenInterestForPair = async (_optionMarketsByPair: any) => {
    let _singlePairOptionMarkets: any = combinePairDict(
      _optionMarketsByPair,
      "BTC/USDC"
    );

    if (_singlePairOptionMarkets) {
      setSinglePairOptionMarkets(_singlePairOptionMarkets);
      const openInterest: any = await getOpenInterestFromPair(
        _singlePairOptionMarkets
      );
      let newOpenInterest = { ...optionMarketContext.openInterest };
      newOpenInterest["BTC/USDC"] = openInterest["BTC/USDC"];
      optionMarketContext.updateOpenInterest(newOpenInterest);
    }
  };

  const fetchSerumData = async () => {
    let _serumData: any = {};
    // TODO: MAKE GLOBAL CONTEXT
    if (singlePairOptionMarkets && singlePairOptionMarkets["BTC/USDC"]) {
      let om;
      if (
        singlePairOptionMarkets["BTC/USDC"] &&
        singlePairOptionMarkets["USDC/BTC"]
      ) {
        om = singlePairOptionMarkets["BTC/USDC"].concat(
          singlePairOptionMarkets["USDC/BTC"]
        );
      } else if (singlePairOptionMarkets["BTC/USDC"]) {
        om = singlePairOptionMarkets["BTC/USDC"];
      } else if (singlePairOptionMarkets["USDC/BTC"]) {
        om = singlePairOptionMarkets["USDC/BTC"];
      }
      if (om) {
        for (const m in om) {
          const sd = await getSerum(om[m]);

          if (sd && sd.optionMarketAddress && sd.serumMarketAddress) {
            _serumData[sd.optionMarketAddress] = sd;
          }
        }
        let _serumMarkets = {
          ...optionMarketContext.serumMarkets,
          "BTC/USDC": _serumData,
        };
        console.log(_serumMarkets);

        optionMarketContext.updateSerumMarkets(_serumMarkets);
      }
    }
  };

  const getSerum = async (m: any) => {
    if (program) {
      const data = await getSerumAddressAndMarketData(
        program.programId,
        new PublicKey(m.optionMarketKey),
        new PublicKey(m.quoteAssetMint.mint),
        new PublicKey(m.underlyingAssetMint.mint)
      );
      return data;
    }
  };
  return <div>{children}</div>;
};

export default OptionMarketContextInit;
