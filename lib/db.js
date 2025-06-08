import { Pool } from "pg";
import { USER, HOST, DATABASE, PASSWORD, PORT } from "../config.js";

const pool = new Pool({
  user: USER,
  host: HOST,
  database: DATABASE,
  password: PASSWORD,
  port: PORT,
});

export default pool;
