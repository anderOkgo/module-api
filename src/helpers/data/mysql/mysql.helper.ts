export const generateInCondition = (label: string, val: string[]) =>
  ` AND ${label} IN (${val.map(() => '?').join(', ')})`;

export const generateLikeCondition = (label: string) => ` AND ${label} LIKE CONCAT('%', ?, '%')`;

export const generateEqualCondition = (label: string) => ` AND ${label} = ?`;

export const generateLimit = () => ` LIMIT ?`;

export const generateOrderBy = (label: string, direction: string) => ` ORDER BY ${label} ${direction}`;

export const generateBetweenCondition = (label: string, val: number[]) =>
  val.length >= 2 ? ` AND ${label} BETWEEN ? and ?` : '';

export const generateAndCondition = (label: string, val: number[]) =>
  val.map(() => ` AND ${label} LIKE CONCAT('%', ?, '%')`).join('');
