import moment from "moment";
import { useState } from "react";
type Props = {
  labelType: string;
  currentLabel: any;
  handleLabelSelection: any;
  choices: any;
};
export default function ActivePairDropdown({
  labelType,
  currentLabel,
  handleLabelSelection,
  choices,
}: Props) {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const handleSelection = (choice: string) => {
    console.log("hello1");
    console.log("hello2");
    handleLabelSelection(labelType, choice);
    setShowDropdown(false);
  };

  return (
    <>
      {choices && (
        <div className="dropdown  z-20 mr-2 font-bold">
          <div
            className="btn font-bold bg-white text-black   text-md dropdown-end hover:cursor-pointer px-5"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {labelType === "expiration"
              ? moment.unix(parseInt(currentLabel)).format("MM/DD")
              : labelType === "contractSize"
              ? parseInt(currentLabel) / 10 ** 5
              : currentLabel}
          </div>

          {choices &&
            choices.length > 0 &&
            choices[0].toString() !== currentLabel.toString() &&
            showDropdown && (
              <ul
                style={{ backgroundColor: "#2a2e37" }}
                className="p-2 mt-3 text-md text-white  shadow menu dropdown-content-custom bg-base-100 rounded-box w-52"
              >
                {choices
                  .filter((d: any) => {
                    return d.toString() !== currentLabel.toString();
                  })
                  .sort()
                  .map((choice: any, key: number) => {
                    let displayValue = choice;
                    console.log(labelType);

                    if (labelType === "expiration") {
                      displayValue = moment
                        .unix(parseInt(choice))
                        .format("MM/DD");
                    } else if (labelType === "contractSize") {
                      displayValue = parseInt(choice) / 10 ** 5;
                    }
                    return (
                      <li key={key}>
                        {
                          // eslint-disable-next-line jsx-a11y/anchor-is-valid
                          <a onClick={(e) => handleSelection(choice)}>
                            {displayValue}
                          </a>
                        }
                      </li>
                    );
                  })}
              </ul>
            )}
        </div>
      )}
    </>
  );
}
