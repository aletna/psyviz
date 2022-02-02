import Skeleton from "../Skeleton";

export default function MarketCountStats(props: any) {
  return (
    <div className="shadow bg-white stats  ">
      <div className="stat bg-white text-black">
        <div className="stat-title text-lg text-black font-bold">
          {props.title}
        </div>
        <div className="stat-value">
          {props.count >= 0 ? props.count : <Skeleton />}
        </div>
        <div className="stat-desc"></div>
      </div>
    </div>
  );
}
