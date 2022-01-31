import { Program } from "@project-serum/anchor";
import { createContext } from "react";
import { ReactNode, useContext, useEffect } from "react";
import { useProgram } from "../../hooks/useProgram";
import { getOpenInterestFromPair } from "../../utils/OpenInterestUtils";
import { combinePairDict } from "../../utils/optionMarketUtils";
import {
  getAllOpenPsyOptionMarkets,
  getParsedMarketsGroupedByPair,
} from "../../utils/psyOptionMarketUtils";
import { fetchCurrentSerumMarkets } from "../../utils/serumUtils";
import { getTokenDict } from "../../utils/tokenUtls";

interface OptionMarketContextProps {
  optionMarkets: any;
  updateOptionMarkets: (_optionMarkets: any) => void;
  singlePairOptionMarkets: any;
  updateSinglePairOptionMarkets: (_optionMarkets: any) => void;
  openInterest: any;
  updateOpenInterest: (_openInterest: any) => void;
  tokenDict: any;
  updateTokenDict: (_tokenDict: any) => void;
  serumMarkets: any;
  updateSerumMarkets: (_serumMarkets: any) => void;
  activePair: string;
  updateActivePair: (_activePair: string) => void;
}

export const OptionMarketContext = createContext<OptionMarketContextProps>({
  optionMarkets: {},
  updateOptionMarkets: (_optionMarkets: any) => {},
  singlePairOptionMarkets: {},
  updateSinglePairOptionMarkets: (_optionMarkets: any) => {},
  openInterest: {},
  updateOpenInterest: (_openInterest: any) => {},
  tokenDict: {},
  updateTokenDict: (_tokenDict: any) => {},
  serumMarkets: {},
  updateSerumMarkets: (_serumMarkets: any) => {},
  activePair: "",
  updateActivePair: (_activePair: string) => {},
});

export const OptionMarketContextConsumer = OptionMarketContext.Consumer;
export const OptionMarketContextProvider = OptionMarketContext.Provider;

type Props = {
  children?: ReactNode;
};

const OptionMarketContextInit = ({ children }: Props) => {
  const optionMarketContext = useContext(OptionMarketContext);
  const program = useProgram();

  useEffect(() => {
    if (program) {
      fetchTokenDict();
      fetchAllOpenOptionMarkets(program);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program]);

  useEffect(() => {
    if (optionMarketContext.singlePairOptionMarkets) {
      console.log("oooo");

      fetchSerumData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionMarketContext.singlePairOptionMarkets]);

  const fetchTokenDict = async () => {
    const _tokenDict = await getTokenDict();
    optionMarketContext.updateTokenDict(_tokenDict);
  };

  const fetchAllOpenOptionMarkets = async (program: Program) => {
    const _optionMarkets = await getAllOpenPsyOptionMarkets(program);

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
    console.log(">>>>>>>", _singlePairOptionMarkets);

    if (_singlePairOptionMarkets) {
      optionMarketContext.updateSinglePairOptionMarkets(
        _singlePairOptionMarkets
      );
      const openInterest: any = await getOpenInterestFromPair(
        _singlePairOptionMarkets
      );
      let newOpenInterest = { ...optionMarketContext.openInterest };
      newOpenInterest["BTC/USDC"] = openInterest["BTC/USDC"];
      optionMarketContext.updateOpenInterest(newOpenInterest);
    }
  };

  const fetchSerumData = async () => {
    let sm;
    if (optionMarketContext.serumMarkets) {
      sm = optionMarketContext.serumMarkets;
    } else {
      sm = {};
    }
    if (optionMarketContext.singlePairOptionMarkets && program) {
      console.log("Sssasd");

      const _serumMarkets = await fetchCurrentSerumMarkets(
        sm,
        optionMarketContext.singlePairOptionMarkets,
        program.programId,
        "BTC/USDC"
      );
      optionMarketContext.updateSerumMarkets(_serumMarkets);
    }
  };

  return <div>{children}</div>;
};

export default OptionMarketContextInit;
