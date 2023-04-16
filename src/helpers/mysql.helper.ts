const generateinCondition = (label: string, val: string) => ` AND ${label} IN (${val})`;
const generateLikeCondition = (label: string, val: string) => ` AND ${label} LIKE "%${val}%"`;
const generateEqualCondition = (label: string, val: string) => ` AND ${label} = "${val}"`;
const generateLimit = (label: string, val: string) =>
  val === undefined || parseInt(val) > 1000 ? ` ${label} 10` : ` ${label} ` + val;

const generateBetweenCondition = (label: string, val: string) => {
  let parts: string[] = val.split(',');
  if (parts.length === 1) return ` AND ${label} = ${val}`;
  else if (parts.length >= 2) return ` AND ${label} BETWEEN ${parts[0]} and ${parts[1]}`;
};

const generateAndCondition = (label: string, val: string) => {
  let parts: string[] = val.split(',');
  let str: string = '';
  if (parts.length === 1) return ` AND ${label} = "${val}"`;
  parts.forEach((e) => (str += ` AND ${label} like "%${e}%"`));
  return str;
};

export {
  generateinCondition,
  generateLikeCondition,
  generateEqualCondition,
  generateLimit,
  generateBetweenCondition,
  generateAndCondition,
};
