import { Repository } from "typeorm";
import { DataBaseSource } from "../config/database";
import { Deletados, Termos, Usuario, UsuarioTermo } from "../models";
import { ICreateUsuario } from "../interfaces/usuario";
import { IPromiseResponse } from "../interfaces/promises";
import { IReqTermoUpdate, IReqTermos } from "../interfaces/termos";
import { addDoc, arrayUnion, collection, doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../config/firebase";
import * as bcrypt from "bcrypt";
import { Log } from "../models/Log";

class UserService {
   private repository: Repository<Usuario>;
   private usuarioTermoRepository: Repository<UsuarioTermo>;
   private termoRepository: Repository<Termos>;
   private logRepositorio: Repository<Log>;
   constructor() {
      this.repository = DataBaseSource.getRepository(Usuario);
      this.usuarioTermoRepository = DataBaseSource.getRepository(UsuarioTermo);
      this.termoRepository = DataBaseSource.getRepository(Termos);
      this.logRepositorio = DataBaseSource.getRepository(Log);
   }
   private async createResponsavel(responsavel: ICreateUsuario): Promise<number> {
      const repositorio = this.repository;
      try {
         const getRespEmail = await this.getUserByEmail(responsavel.email);
         if (getRespEmail.data) return 0;
         responsavel.senha = bcrypt.hashSync(responsavel.senha, bcrypt.genSaltSync(15));
         const insert = repositorio.create(responsavel);
         const resp = await repositorio.save(insert);
         return resp.id;
      } catch (error: any) {
         throw new Error(error);
      }
   }

   public async deleteUsuario(usuarioId: number) {
      const user = await this.repository.findOne({
         where: {
            id: usuarioId,
         },
         relations: {
            responsavel: true,
         },
      });
      await this.repository
         .createQueryBuilder()
         .where("id = :usuarioId", {
            usuarioId,
         })
         .delete()
         .execute();
      await this.repository
         .createQueryBuilder()
         .where("id = :usuarioId", {
            usuarioId: user?.responsavel.id,
         })
         .delete()
         .execute();
      const deletedData: {
         usaurio_id: number;
      }[] = [
         {
            usaurio_id: usuarioId,
         },
         user
            ? {
                 usaurio_id: user?.responsavel.id,
              }
            : undefined,
      ].filter(Boolean) as {
         usaurio_id: number;
      }[];
      const refDatabase = doc(collection(db, "deletados"), "KOXlc4U2oQ2WvyM6J3gQ");
      deletedData.forEach(async (data) => {
         await updateDoc(refDatabase, {
            id: arrayUnion(data),
         });
      });
   }

   private async createTermo(usaurioId: number, termos: IReqTermos, responsavelId?: number): Promise<void> {
      const lastRegister = await this.termoRepository.findOne({
         order: {
            id: "DESC",
         },
         where: {},
      });
      console.log(termos);
      const data = {
         uso_condicao: termos.uso_condicao,
         markting_comunicaoo: termos.markting_comunicaoo,
         markting_atualizacao: termos.markting_atualizacao,
         maior_idade: responsavelId ? true : false,
         usuario: {
            id: usaurioId,
         },
         responsavel: responsavelId
            ? {
                 id: responsavelId,
              }
            : undefined,
         termos: {
            id: lastRegister?.id,
         },
      };
      console.log(data);
      const insert = this.usuarioTermoRepository.create(data);
      await this.usuarioTermoRepository.save(insert);
   }

   public async getUser(id: number): Promise<IPromiseResponse> {
      try {
         const select = await this.repository.findOne({
            where: { id: id },
            relations: { responsavel: true, condicoes: { termos: true } },
         });
         return {
            data: select,
            isError: false,
            msg: `Usuario achado`,
         };
      } catch (error: any) {
         return {
            data: null,
            isError: true,
            msg: `Erro ao cadastrar o usuário`,
            msgError: error,
         };
      }
   }

   public async getUserByEmail(email: string): Promise<IPromiseResponse> {
      try {
         const getEmail = await this.repository.findOne({ where: { email: email } });
         if (!getEmail) {
            return {
               data: null,
               isError: true,
               msg: "Usuario não encontrado",
            };
         }

         return {
            data: getEmail,
            isError: false,
            msg: "",
         };
      } catch (error: any) {
         return {
            data: "",
            isError: false,
            msg: "",
            msgError: error,
         };
      }
   }

   public async createUser(
      user: ICreateUsuario,
      termos: IReqTermos,
      responsavel?: ICreateUsuario,
   ): Promise<IPromiseResponse> {
      const repositorio = this.repository;
      try {
         let respId: number | undefined;
         const userEmail = await this.getUserByEmail(user.email);

         if (userEmail.data) return { data: null, msg: "Email já em uso", isError: true };
         if (responsavel) respId = await this.createResponsavel(responsavel);
         if (respId == 0) return { data: null, msg: "Email do responsavel já em uso", isError: true };

         const hashPassword = bcrypt.hashSync(user.senha, bcrypt.genSaltSync(15));
         const userEntity = this.repository.create({
            nome: user.nome,
            nick: user.nick,
            email: user.email,
            senha: hashPassword,
            cpf: user.cpf,
            dataNascimento: user.dataNascimento,
            responsavel: respId
               ? {
                    id: respId,
                 }
               : undefined,
         });

         await repositorio.save(userEntity);
         await this.createTermo(userEntity.id, termos, respId);
         return {
            data: userEntity,
            isError: false,
            msg: "Usuário cadastrado com sucesso!",
         };
      } catch (error: any) {
         return {
            data: null,
            isError: true,
            msg: `Erro ao cadastrar o usuário: ${error.message || error}`,
         };
      }
   }

   public async UpdateUserTerm(id: number, body: IReqTermoUpdate) {
      const selectUser = await this.usuarioTermoRepository.findOne({ where: { usuario: { id: id } } });
      let log = "";
      let validar = false;
      if (body.markting_atualizacao !== selectUser?.markting_atualizacao) {
         log += `Marketing Atualização Atualizado, Definido como: ${body.markting_atualizacao} Dia ${new Date()}\n`;
         validar = true;
      }
      if (body.markting_comunicaoo !== selectUser?.markting_comunicaoo) {
         log += `Marketing Comunicação Atualizado, Definido como: ${body.markting_atualizacao} Dia ${new Date()}`;
         validar = true;
      }
      const att =
         body.markting_atualizacao === selectUser?.markting_atualizacao
            ? selectUser?.markting_atualizacao
            : body.markting_atualizacao;
      const com =
         body.markting_comunicaoo === selectUser?.markting_comunicaoo
            ? selectUser?.markting_comunicaoo
            : body.markting_comunicaoo;
      await this.usuarioTermoRepository.update(Number(selectUser?.id), {
         markting_atualizacao: att,
         markting_comunicaoo: com,
      });

      if (validar) {
         const insert = this.logRepositorio.create({ usuario: { id: id }, msg: log });
         await this.logRepositorio.save(insert);
         await DataBaseSource.getRepository("logs_usuario_usuario").insert({ logsId: insert.id, usuarioId: id });
      }
   }
}

export default new UserService();
