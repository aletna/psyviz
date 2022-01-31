import { ReactNode, useState } from "react";

import OptionMarketContext, {
  OptionMarketContextProvider,
} from "./OptionMarketContextInit";

type Props = {
  children?: ReactNode;
};

const ContextProvider = ({ children }: Props) => {
  const [optionMarkets, setOptionMarkets] = useState<any>();
  const [openInterest, setOpenInterest] = useState<any[]>();
  const [tokenDict, setTokenDict] = useState<any>();
  const [serumMarkets, setSerumMarkets] = useState<any>({});

  const updateOptionMarkets = (_optionMarkets: any) => {
    setOptionMarkets(_optionMarkets);
  };

  const updateTokenDict = (_tokenDict: any) => {
    setTokenDict(_tokenDict);
  };
  const updateOpenInterest = (_openInterest: any) => {
    setOpenInterest(_openInterest);
  };
  const updateSerumMarkets = (_serumMarkets: any) => {
    setSerumMarkets(_serumMarkets);
  };

  const optionMarketContextValues = {
    optionMarkets,
    updateOptionMarkets,
    openInterest,
    updateOpenInterest,
    tokenDict,
    updateTokenDict,
    serumMarkets,
    updateSerumMarkets,
  };

  return (
    <OptionMarketContextProvider value={optionMarketContextValues}>
      <OptionMarketContext>{children}</OptionMarketContext>
    </OptionMarketContextProvider>
  );
};

export default ContextProvider;
