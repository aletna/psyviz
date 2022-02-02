export function optionMarketIsNotExpired(obj: any) {
  const exp = obj.account.expirationUnixTimestamp.toString();
  if (Date.now() / 1000 < exp && !obj.account.expired) {
    return true;
  }
  return false;
}
export function otherSide(x: string) {
  if (x === "buy") {
    return "sell";
  } else {
    return "buy";
  }
}
export function getOptionType(pair: string) {
  let mp = pair.split("/");
  if (mp.includes("USDC")) {
    if (mp[0] === "USDC") {
      return "put";
    } else {
      return "call";
    }
  }
  return;
}
