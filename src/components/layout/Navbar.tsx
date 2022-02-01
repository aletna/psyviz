import ActivePairDropdown from "../ActivePairDropdown";
import NavButtons from "../NavButtons";

type Props = {
  title?: string;
  activePair?: string;
  setActivePair?: React.Dispatch<React.SetStateAction<string>>;
};

export default function Footer({ title, activePair, setActivePair }: Props) {
  return (
    <div className="p-5">
      <div className="flex justify-between items-center bg-gradient-to-r from-purple-500 to-pink-500  p-3 shadow-lg rounded-lg">
        <h1 className="text-2xl text-red-50 ">{title}</h1>
        <div className="flex">
          {
            <div className="hidden md:flex">
              <NavButtons
                activePair={activePair}
                setActivePair={setActivePair}
              />
            </div>
          }
          {
            <div className="md:hidden">
              <ActivePairDropdown
                activePair={activePair}
                setActivePair={setActivePair}
              />
            </div>
          }
        </div>
      </div>
    </div>
  );
}
