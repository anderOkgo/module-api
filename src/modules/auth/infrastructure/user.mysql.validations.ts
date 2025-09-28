export const validateEmail = async (email: string, Database: any, HDB: any) => {
  const sqlEmail = `SELECT * FROM users WHERE 1 ${HDB.generateEqualCondition('email')}`;
  const existingEmail = await Database.executeSafeQuery(sqlEmail, [email]);
  if (existingEmail.length > 0) return 'Email already exists';
};

export const validateUsername = async (username: string, Database: any, HDB: any) => {
  const sqluser = `SELECT * FROM users WHERE 1 ${HDB.generateEqualCondition('username')}`;
  const existingUser = await Database.executeSafeQuery(sqluser, [username]);
  if (existingUser.length > 0) return 'User already exists';
};

export const validateVerificationCode = async (email: string, verificationCode: number, Database: any) => {
  if (verificationCode) {
    const sqlEmailVerification = `SELECT * FROM email_verification WHERE email = ? AND verification_code = ?`;
    const result = await Database.executeSafeQuery(sqlEmailVerification, [email, verificationCode]);
    if (!(result.length > 0)) return 'Invalid verification code';
  }
};

export const userInfo = async (name: string, Database: any): Promise<any | false> => {
  // Primero intentar buscar por username
  let data = await Database.executeSafeQuery('SELECT * FROM users WHERE username = ?', [name]);

  // Si no se encuentra por username, buscar por email
  if (data.length === 0) {
    data = await Database.executeSafeQuery('SELECT * FROM users WHERE email = ?', [name]);
  }

  return data.length > 0 ? data[0] : false;
};
