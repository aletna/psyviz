import { formatNumber } from "../utils/global";
import Skeleton from "./Skeleton";

export default function Stats(props: any) {
  return (
    <div className="shadow bg-white stats  ">
      <div className="stat bg-white text-black">
        <div className="stat-title text-lg font-bold">
          TVL -{" "}
          {props.activePair.split("/")[0] +
            " / " +
            props.activePair.split("/")[1]}
        </div>
        <div className="stat-value">
          {props.TVL >= 0 ? "$" + formatNumber(props.TVL) : <Skeleton />}
        </div>
        <div className="stat-desc">USD Value</div>
      </div>
    </div>
  );
}
