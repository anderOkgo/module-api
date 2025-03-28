export default interface User {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: number;
  password: string;
  active: number;
  created: string;
  modified: string;
  verificationCode?: number;
}
