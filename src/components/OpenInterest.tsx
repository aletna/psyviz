import { useEffect, useState } from "react";
import { getOpenInterest } from "../utils/OpenInterestUtils";

export default function OptionMarket(props: any) {
  const [data, setData] = useState<any>();
  useEffect(() => {
    _getOpenInterest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.optionMarkets]);

  const _getOpenInterest = async () => {
    const res = await getOpenInterest(props.optionMarkets);
    let arr = [];
    for (const r in res) {
      arr.push(res[r]);
    }
    console.log(arr,res);

    setData(res);
  };

  return (
    <div
      style={{ border: "2px solid lightblue", margin: "12px", padding: "12px" }}
    >
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
