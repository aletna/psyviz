import { createContext } from "react";
import { ReactNode, useContext, useEffect } from "react";

interface OptionMarketContextProps {
  optionMarkets: any[];
  updateOptionMarkets: (wallets: any[]) => void;
}

const OptionMarketContext = createContext<OptionMarketContextProps>({
  optionMarkets: [],
  updateOptionMarkets: (optionMarkets: any[]) => {},
});

export const OptionMarketContextConsumer = OptionMarketContext.Consumer;
export const OptionMarketContextProvider = OptionMarketContext.Provider;

type Props = {
  children?: ReactNode;
};

const OptionMarketContextInit = ({ children }: Props) => {
  const optionMarketContext = useContext(OptionMarketContext);

  useEffect(() => {
    optionMarketContext.updateOptionMarkets([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div>{children}</div>;
};

export default OptionMarketContextInit;
