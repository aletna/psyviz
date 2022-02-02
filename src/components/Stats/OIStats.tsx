import { formatNumber } from "../../utils/global";
import Skeleton from "../Skeleton";

export default function OIStats(props: any) {
  return (
    <div className="shadow bg-white stats  ">
      <div className="stat bg-white text-black">
        <div className="stat-title text-lg text-black font-bold">Total Open Interest</div>
        <div className="stat-value">
          {props.TOI >= 0 ? formatNumber(props.TOI) : <Skeleton />}
        </div>
        <div className="stat-desc"></div>
      </div>
    </div>
  );
}
