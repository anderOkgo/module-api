/**
 * Express's `trust proxy` setting, so `req.ip` is the client and not the web server in front of the
 * app (Auth SPEC v0.6, L5). Production runs behind one proxy (LiteSpeed on cPanel), which appends the
 * client's address to `X-Forwarded-For`; trusting exactly one hop takes that last entry, which the
 * client cannot write. `TRUST_PROXY` overrides it: a number of hops (`0` when nothing is in front),
 * or any value Express accepts, such as `loopback`.
 */
export function trustProxySetting(value: string | undefined = process.env.TRUST_PROXY): number | string {
  if (value === undefined || value.trim() === '') return 1;
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}
