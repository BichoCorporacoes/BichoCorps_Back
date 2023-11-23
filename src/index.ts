import express from "express";
import cors from "cors";
import { DataBaseSource } from "./config/database";
import router from "./routes";

let port = 5000;

const app = express();

app.listen({ port: port, host: "0.0.0.0" }, () => {
   console.log(`App is running on port ${port}`);
});

DataBaseSource.initialize()
   .then(() => {
      console.log("Banco inicializado com sucesso!");
   })
   .catch((err) => {
      console.error("Erro durante a inicialização do banco: ", err);
   });

app.use(cors());
app.use(express.json());
app.use(router);
app.use(express.json());
