import { NextFunction, Request, Response } from "express";
import { ICreateUsuario, RequestLogin } from "../interfaces/usuario";
import serviceUser from "../service/userService";
import { IReqTermoUpdate, IReqTermos } from "../interfaces/termos";
import * as childProcess from "child_process";
import dumpService from "../service/dumpService";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

class UserController {
   private static isAdult(birthDate: Date): boolean {
      const eighteenYearsAgo = new Date();
      const newDate = new Date(birthDate);
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 16);
      const age = eighteenYearsAgo.getFullYear() - newDate.getFullYear();
      return (
         age > 0 ||
         (age === 0 && eighteenYearsAgo.getMonth() >= newDate.getMonth() && eighteenYearsAgo.getDate() >= newDate.getDate())
      );
   }

   public async UserLogin(req: Request, res: Response) {
      const data: RequestLogin = req.body;
      const mandatoryProperties: (keyof RequestLogin)[] = ["email", "senha"];
      const allPresentProperties = mandatoryProperties.every(
         (properties) => data[properties] !== undefined && data[properties] !== null,
      );
      if (!allPresentProperties) {
         return res.status(400).json({
            isError: true,
            data: null,
            msg: "Por favor, insira todos os valores obrigatórios do usuário.",
         });
      }
      const user = await serviceUser.getUserByEmail(data.email);
      if (user.data == null) return res.json(user);

      const isPasswordValid = await bcrypt.compare(data.senha, user.data.senha);

      if (!isPasswordValid) {
         return res.status(401).json({ error: "Por favor, cheque as suas credenciais e tente novamenete." });
      }

      const token = jwt.sign({ id: user.data.id }, "BichoCorps", { expiresIn: "1D" });
      return res.json({ ...user, token });
   }

   public async CreateUser(req: Request, res: Response) {
      let insert;

      const data: ICreateUsuario = req.body;
      const mandatoryProperties: (keyof ICreateUsuario)[] = ["nome", "nick", "email", "senha", "cpf", "dataNascimento"];
      const allPresentProperties = mandatoryProperties.every(
         (properties) => data[properties] !== undefined && data[properties] !== null,
      );

      const termos: IReqTermos = req.body.termos;
      const mandatoryTermosProperties: (keyof IReqTermos)[] = [
         "markting_atualizacao",
         "markting_comunicaoo",
         "uso_condicao",
      ];
      const allTermoPresentProperties = mandatoryTermosProperties.every(
         (properties) => termos[properties] !== undefined && termos[properties] !== null,
      );

      if (!allPresentProperties) {
         return res.status(400).json({
            isError: true,
            data: null,
            msg: "Por favor, insira todos os valores obrigatórios do usuário.",
         });
      }

      if (!allTermoPresentProperties) {
         return res.status(400).json({
            isError: true,
            data: null,
            msg: "Por favor, concorde com todos os termos",
         });
      }

      if (!UserController.isAdult(data.dataNascimento)) {
         if (!data.responsavel || !UserController.isAdult(data.responsavel?.dataNascimento)) {
            return res.status(400).json({
               isError: true,
               data: null,
               msg: "Para usuários não adultos, é necessário fornecer um responsável que seja adulto.",
            });
         }
         insert = await serviceUser.createUser(data, termos, data.responsavel);
      } else {
         insert = await serviceUser.createUser(data, termos);
      }
      return res.status(200).json(insert);
   }

   public async Deleteuser(req: Request, res: Response) {
      try {
         const { usuarioId } = req.params;
         const id = Number(usuarioId);
         await serviceUser.deleteUsuario(id);
         res.status(200).json({
            isError: false,
            data: null,
            msg: `Deletado com sucesso`,
         });
      } catch (error) {
         return res.status(400).json({
            isError: true,
            data: null,
            msg: `Algo deu errado: ${error}`,
         });
      }
   }
   public async ReadOnlyUserId(req: Request, res: Response) {
      const id = Number(req.params.id);
      try {
         const query = await serviceUser.getUser(id);
         if (query.isError) {
            res.status(400).json(query);
         }
         res.status(200).json(query);
      } catch (error) {
         res.status(400).json(error);
      }
   }

   public async CreateBackUp(req: Request, res: Response) {
      try {
         const data = await dumpService.createDump();
         if (data?.isError) {
            return res.status(400).json(data);
         }
         res.status(200).json(data);
      } catch (error) {
         res.status(500).json(error);
      }
   }
   public async RestoreUp(req: Request, res: Response) {
      try {
         const files = req.file;
         if (!files) {
            return res.status(400).json({
               isError: true,
               msg: "Formaluario Invalido",
               data: null,
            });
         }
         // if (files.mimetype !== "application/x-sql") {
         //    return res.status(400).json({
         //       isError: true,
         //       msg: "Formato não permitido",
         //       data: null,
         //    });
         // }
         const data = await dumpService.restoreDatabase(files);
         if (data?.isError) {
            return res.status(400).json(data);
         }
         res.status(200).json(data);
      } catch (error) {
         res.status(400).json(error);
      }
   }
   public async UpdateTermo(req: Request, res: Response) {
      const { id } = req.params;
      const body: IReqTermoUpdate = req.body;
      await serviceUser.UpdateUserTerm(Number(id), body);
      return res.status(200).json("Atualizado");
   }
}

const userController: UserController = new UserController();

export default userController;
