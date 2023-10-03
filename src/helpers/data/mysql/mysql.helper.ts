export const generateInCondition = (label: string, val: string) => ` AND ${label} IN (${val})`;
export const generateLikeCondition = (label: string, val: string) => ` AND ${label} LIKE "%${val}%"`;
export const generateEqualCondition = (label: string, val: string) => ` AND ${label} = "${val}"`;
export const generateLimit = (label: string, val: string) => ` ${label} ${val}`;
export const generateBetweenCondition = (label: string, val: number[]) =>
  val.length >= 2 ? ` AND ${label} BETWEEN ${val[0]} and ${val[1]}` : '';
export const generateAndCondition = (label: string, val: number[]) =>
  val.map((e) => ` AND ${label} LIKE "%${e}%"`).join('');
