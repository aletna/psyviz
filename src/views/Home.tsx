import { Program, ProgramAccount } from "@project-serum/anchor";
import { Idl, IdlTypeDef } from "@project-serum/anchor/dist/cjs/idl";
import {
  IdlTypes,
  TypeDef,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { useEffect, useState } from "react";
import OpenInterest from "../components/OpenInterest";
import OptionMarket from "../components/OptionMarket";
import Volume from "../components/Volume";
import { useProgram } from "../hooks/useProgram";
import {
  getAllOpenPsyOptionMarkets,
  getOptionMintHolders,
  getOptionMintInfo,
  getSerumMarket,
} from "../utils/psyOptionMarketUtils";
import { getTokenDict } from "../utils/tokenUtls";

export default function Home() {
  const [optionMarkets, setOptionMarkets] =
    useState<ProgramAccount<TypeDef<IdlTypeDef, IdlTypes<Idl>>>[]>();
  const program = useProgram();

  useEffect(() => {
    if (program) {
      getTokenDict();
      getAllOptionMarkets(program);
    }
  }, [program]);

  const getAllOptionMarkets = async (program: Program) => {
    const _optionMarkets = await getAllOpenPsyOptionMarkets(program);
    setOptionMarkets(_optionMarkets);
  };

  //   useEffect(() => {
  //     if (optionMarkets && optionMarkets.length > 0) {
  //       console.log(optionMarkets[0]);
  //       getOptionMintInfo(optionMarkets[0].account.optionMint);
  //       getOptionMintHolders(optionMarkets[0].account.optionMint);
  //       if (program) {
  //         getSerumMarket(
  //           program.programId,
  //           optionMarkets[0].publicKey,
  //           optionMarkets[0].account.quoteAssetMint,
  //           optionMarkets[0].account.underlyingAssetMint
  //         );
  //       }
  //     }
  //   }, [optionMarkets, program]);

  return (
    <div>
      {/* {program && optionMarkets?.map((optionMarket) => (
        <OptionMarket
          key={optionMarket.publicKey.toBase58()}
          optionMarket={optionMarket}
          programId = {program.programId}
        />
      ))} */}

      {/* OPEN INTEREST */}
      {program && optionMarkets && (
        <OpenInterest optionMarkets={optionMarkets} />
      )}
      {/* {program && optionMarkets && (
        <Volume optionMarkets={optionMarkets} program={program} />
      )} */}
    </div>
  );
}
