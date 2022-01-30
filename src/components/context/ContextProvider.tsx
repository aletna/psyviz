
import { ReactNode, useState } from "react";

import OptionMarketContext, {
  OptionMarketContextProvider,
} from "./OptionMarketContext";

type Props = {
  children?: ReactNode;
};

const ContextProvider = ({ children }: Props) => {
  const [optionMarkets, setOptionMarkets] = useState<string[]>([]);

  const updateOptionMarkets = (_optionMarkets: any[]) => {
    setOptionMarkets(_optionMarkets);
  };

  const optionMarketContextValues = {
    optionMarkets,
    updateOptionMarkets,
  };

  return (
    <OptionMarketContextProvider value={optionMarketContextValues}>
      <OptionMarketContext>{children}</OptionMarketContext>
    </OptionMarketContextProvider>
  );
};

export default ContextProvider;
