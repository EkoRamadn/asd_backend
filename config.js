import dotenv from "dotenv";
dotenv.config();

const DATABASE = process.env.DATABASE;
const HOST = process.env.HOST;
const USER = process.env.USER;
const PASSWORD = process.env.PASSWORD;
const PORT = parseInt(process.env.PORT, 10);

export { DATABASE, HOST, USER, PASSWORD, PORT };
