import { Responsive, WidthProvider } from "react-grid-layout";
import { capitalizeFirstLetter, pairToCoinGecko } from "../utils/global";
import BarChart from "./graphs/BarChart";
import LineChart from "./graphs/LineChart";
import PieChart from "./graphs/PieChart";
import Dropdown from "./layout/Dropdown";
import Skeleton from "./Skeleton";

// Handles the responsive nature of the grid
const ResponsiveGridLayout = WidthProvider(Responsive);
// Determines the screen breakpoints for the columns
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 320 };
// How many columns are available at each breakpoint
const cols = { lg: 4, md: 4, sm: 1, xs: 1, xxs: 1 };
const optionBars = ["calls", "puts"];
type Props = {
  activePair: string;
  currencyPrice?: number;
  historicData: any;
  dataVolume: any;
  VMLoading: boolean;
  dataTrades: any;
  TMLoading: boolean;
  openCalls: number;
  openPuts: number;
  OICLoading: boolean;
  shapedData: any;
  OISPLoading: boolean;
  biweeklyVolume: any;
  DVLoading: boolean;
  expiryData: any;
  OIELoading: boolean;
  biweeklyTrades: any;
  DTLoading: boolean;
  callOrderBookData: any;
  putOrderBookData: any;
  currentCallStrikePrice: any;
  handleLabelSelection: any;
  fullOrderBookData: any;
  currentCallExpiration: any;
  currentCallContractSize: any;
  currentPutStrikePrice: any;
  currentPutExpiration: any;
  currentPutContractSize: any;
};
export default function ResponsiveGridComponent({
  activePair,
  currencyPrice,
  historicData,
  dataVolume,
  VMLoading,
  dataTrades,
  TMLoading,
  openCalls,
  openPuts,
  OICLoading,
  shapedData,
  OISPLoading,
  biweeklyVolume,
  DVLoading,
  expiryData,
  OIELoading,
  biweeklyTrades,
  DTLoading,
  callOrderBookData,
  putOrderBookData,
  currentCallStrikePrice,
  handleLabelSelection,
  fullOrderBookData,
  currentCallExpiration,
  currentCallContractSize,
  currentPutStrikePrice,
  currentPutExpiration,
  currentPutContractSize,
}: Props) {
  return (
    <ResponsiveGridLayout className="" breakpoints={breakpoints} cols={cols}>
      {activePair && (
        <div
          className="grid-cell"
          key="1"
          data-grid={{ x: 0, y: 0, w: 1, h: 2, static: true }}
        >
          <h3 className="grid-header">
            {capitalizeFirstLetter(pairToCoinGecko[activePair])} Price: $
            {currencyPrice && currencyPrice}
          </h3>

          {historicData ? (
            <LineChart data={[historicData]} legend="Day" axisLeft="USD" />
          ) : null}
        </div>
      )}
      <div
        className="grid-cell"
        key="2"
        data-grid={{ x: 1, y: 0, w: 1, h: 2, static: true }}
      >
        <h3 className="grid-header">Serum Volume Metrics</h3>
        {dataVolume && !VMLoading ? (
          <>
            <BarChart
              data={dataVolume}
              keys={["volume"]}
              group={"stacked"}
              layout="horizontal"
              nopadding={false}
            />
          </>
        ) : (
          <Skeleton />
        )}
      </div>
      <div
        className="grid-cell"
        key="3"
        data-grid={{ x: 2, y: 0, w: 1, h: 2, static: true }}
      >
        <h3 className="grid-header">Serum Trade Metrics</h3>
        {dataTrades && !TMLoading ? (
          <>
            <BarChart
              data={dataTrades}
              keys={["trades"]}
              group={"stacked"}
              layout="horizontal"
              nopadding={false}
            />
          </>
        ) : (
          <Skeleton />
        )}
      </div>
      <div
        className="grid-cell"
        key="4"
        data-grid={{ x: 3, y: 0, w: 1, h: 2, static: true }}
      >
        <h3 className="grid-header">Call/Put Ratio</h3>
        {openCalls && openPuts && !OICLoading ? (
          <PieChart data={[openCalls, openPuts]} />
        ) : (
          <Skeleton />
        )}
      </div>
      <div
        className="grid-cell"
        key="5"
        data-grid={{ x: 0, y: 2, w: 2, h: 3, static: true }}
      >
        <h3 className="grid-header">Open Interest by Strike Price</h3>
        {shapedData && !OISPLoading ? (
          <BarChart
            data={shapedData}
            keys={optionBars}
            group="grouped"
            layout="vertical"
            nopadding={false}
          />
        ) : (
          <Skeleton />
        )}
      </div>
      <div
        className="grid-cell"
        key="6"
        data-grid={{ x: 2, y: 2, w: 2, h: 3, static: true }}
      >
        <h3 className="grid-header">Serum Daily Volume</h3>
        {biweeklyVolume && !DVLoading ? (
          <LineChart data={biweeklyVolume} legend="Day" />
        ) : (
          <Skeleton />
        )}
      </div>
      <div className="grid-cell" key="7" data-grid={{ x: 0, y: 5, w: 2, h: 2 }}>
        <h3 className="grid-header">Open Interest by Expiry</h3>
        {expiryData && !OIELoading ? (
          <BarChart
            data={expiryData}
            keys={optionBars}
            layout="vertical"
            group="stacked"
            nopadding={false}
          />
        ) : (
          <Skeleton />
        )}
      </div>
      <div className="grid-cell" key="9" data-grid={{ x: 3, y: 5, w: 2, h: 2 }}>
        <h3 className="grid-header">Serum Daily # of Trades</h3>
        {biweeklyTrades && !DTLoading ? (
          <LineChart data={biweeklyTrades} legend="Day" />
        ) : (
          <Skeleton />
        )}
      </div>
      <div
        className="grid-cell"
        key="10"
        data-grid={{ x: 0, y: 7, w: 2, h: 2 }}
      >
        <div className="flex items-center">
          <h3 className="grid-header">
            {activePair.split("/")[0]} Calls - Serum Open Orders
          </h3>
          <div>
            {/* <div className={`btn font-bold mr-2 text-md`}>{activePair}</div> */}
            {currentCallStrikePrice && (
              <Dropdown
                labelType="strikePrice"
                currentLabel={currentCallStrikePrice}
                handleLabelSelection={handleLabelSelection}
                choices={
                  fullOrderBookData
                    ? fullOrderBookData["allCallStrikePrices"]
                    : []
                }
              />
            )}

            {currentCallExpiration && (
              <Dropdown
                labelType="expiration"
                currentLabel={currentCallExpiration}
                handleLabelSelection={handleLabelSelection}
                choices={
                  fullOrderBookData
                    ? fullOrderBookData["allCallExpirations"]
                    : []
                }
              />
            )}
            {currentCallContractSize && (
              <Dropdown
                labelType="contractSize"
                currentLabel={currentCallContractSize}
                handleLabelSelection={handleLabelSelection}
                choices={
                  fullOrderBookData
                    ? fullOrderBookData["allCallContractSizes"]
                    : []
                }
              />
            )}
          </div>
        </div>

        <BarChart
          data={callOrderBookData}
          keys={["buy", "sell"]}
          layout="vertical"
          group="stacked"
          nopadding={true}
        />
      </div>
      <div
        className="grid-cell"
        key="11"
        data-grid={{ x: 3, y: 7, w: 2, h: 2 }}
      >
        <div className="flex items-center">
          <h3 className="grid-header">
            {activePair.split("/")[0]} Puts - Serum Open Orders
          </h3>
          <div>
            {/* <div className={`btn font-bold mr-2 text-md`}>{activePair}</div> */}
            {currentPutStrikePrice && (
              <Dropdown
                labelType="strikePrice"
                currentLabel={currentPutStrikePrice}
                handleLabelSelection={handleLabelSelection}
                choices={
                  fullOrderBookData
                    ? fullOrderBookData["allPutStrikePrices"]
                    : []
                }
              />
            )}
            {currentPutExpiration && (
              <Dropdown
                labelType="expiration"
                currentLabel={currentPutExpiration}
                handleLabelSelection={handleLabelSelection}
                choices={
                  fullOrderBookData
                    ? fullOrderBookData["allPutExpirations"]
                    : []
                }
              />
            )}
            {currentPutContractSize && (
              <Dropdown
                labelType="contractSize"
                currentLabel={currentPutContractSize}
                handleLabelSelection={handleLabelSelection}
                choices={
                  fullOrderBookData
                    ? fullOrderBookData["allPutContractSizes"]
                    : []
                }
              />
            )}
          </div>
        </div>
        <BarChart
          data={putOrderBookData}
          keys={["buy", "sell"]}
          layout="vertical"
          group="stacked"
          nopadding={true}
        />
      </div>
      )
    </ResponsiveGridLayout>
  );
}
