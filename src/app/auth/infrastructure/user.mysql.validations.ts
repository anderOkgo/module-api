export const validateEmail = async (email: string, Database: any, HDB: any) => {
  const sqlEmail = `SELECT * FROM users WHERE 1 ${HDB.generateEqualCondition('email')}`;
  try {
    const existingEmail = await Database.executeQuery(sqlEmail, [email]);
    if (existingEmail.length > 0) return 'Email already exists';
  } catch (error) {
    console.error('Error executing SQL query for existingEmail:', error);
    return 'Internal server error';
  }
};

export const validateUsername = async (username: string, Database: any, HDB: any) => {
  const sqluser = `SELECT * FROM users WHERE 1 ${HDB.generateEqualCondition('username')}`;
  try {
    const existingUser = await Database.executeQuery(sqluser, [username]);
    if (existingUser.length > 0) return 'User already exists';
  } catch (error) {
    console.error('Error executing SQL query for existingUser:', error);
    return 'Internal server error';
  }
};

export const validateVerificationCode = async (email: string, verificationCode: number, Database: any) => {
  if (verificationCode) {
    const sqlEmailVerification = `SELECT * FROM email_verification WHERE email = ? AND verification_code = ?`;
    try {
      const result = await Database.executeQuery(sqlEmailVerification, [email, verificationCode]);
      if (!(result.length > 0)) return 'Invalid verification code';
    } catch (error) {
      console.error('Error executing SQL query for verificationCode:', error);
      return 'Internal server error';
    }
  }
};

export const userInfo = async(name: string, Database: any): Promise<any | false> {
  try {
    const data = await Database.executeQuery('SELECT * FROM users WHERE username = ?', [name]);
    if (data.length > 0) {
      return data[0]
    } else {
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error executing MySQL query: ${error.message}`);
    } else {
      throw new Error(`An unknown error occurred: ${String(error)}`);
    }
  }
}
