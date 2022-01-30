export function optionMarketIsNotExpired(obj: any) {
  const exp = obj.account.expirationUnixTimestamp.toString();
  if (Date.now() / 1000 < exp && !obj.account.expired) {
    return true;
  }
  return false;
}
