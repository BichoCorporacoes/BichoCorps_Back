import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { Usuario, Termos, UsuarioTermo, Deletados } from "../models";
import { Log } from "../models/Log";

dotenv.config();

const entidades = [UsuarioTermo, Usuario, Termos, Deletados, Log];

export const DataBaseSource = new DataSource({
   type: "mysql",
   host: process.env.HOST,
   port: Number(process.env.PORT),
   username: process.env.DB_USERNAME,
   password: process.env.DB_PASSWORD,
   database: process.env.DATABASE,
   synchronize: true,
   logging: false,
   entities: entidades,
});
