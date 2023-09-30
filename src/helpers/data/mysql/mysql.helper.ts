const generateInCondition = (label: string, val: string) => ` AND ${label} IN (${val})`;
const generateLikeCondition = (label: string, val: string) => ` AND ${label} LIKE "%${val}%"`;
const generateEqualCondition = (label: string, val: string) => ` AND ${label} = "${val}"`;
const generateLimit = (label: string, val: string) => {
  if (val === undefined || val === '') {
    return ` ${label} 100`; // Default value when val is undefined or ''
  } else if (parseInt(val) > 1000) {
    return ` ${label} 100`; // Max value when val is greater than 1000
  } else {
    return ` ${label} ` + val; // Value when val is within the allowed range
  }
};

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
  generateInCondition,
  generateLikeCondition,
  generateEqualCondition,
  generateLimit,
  generateBetweenCondition,
  generateAndCondition,
};
