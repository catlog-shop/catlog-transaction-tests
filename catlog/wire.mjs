export const json = (v) =>
  JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));
export const transferKey = (t) => ({
  merchantId: t.merchantId,
  routeId: t.routeId,
  idempotencyKey: t.idempotencyKey,
});
