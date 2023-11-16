import {NextFunction, Request, Response} from "express";
import {ICreateUsuario} from "../interfaces/usuario";
import serviceUser from "../service/userService";
import {IReqTermos} from "../interfaces/termos";


class UserController {

  private static isAdult(birthDate: Date): boolean {
    const eighteenYearsAgo = new Date();
    const newDate = new Date(birthDate)
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 16);
    const age = eighteenYearsAgo.getFullYear() - newDate.getFullYear();
    return age > 0 || (age === 0 && eighteenYearsAgo.getMonth() >= newDate.getMonth() && eighteenYearsAgo.getDate() >= newDate.getDate());
  }
  
  public async CreateUser(req: Request, res: Response) {
    let insert;

    const data: ICreateUsuario = req.body;
    const mandatoryProperties: (keyof ICreateUsuario)[] = [ "nome", "nick", "email", "senha", "cpf", "dataNascimento" ];
    const allPresentProperties = mandatoryProperties.every(properties => data[properties] !== undefined && data[properties] !== null);

    const termos: IReqTermos = req.body.termos
    const mandatoryTermosProperties: (keyof IReqTermos)[] = [ "markting_atualizacao", "markting_comunicaoo", "uso_condicao" ];
    const allTermoPresentProperties = mandatoryTermosProperties.every(properties => termos[properties] !== undefined && termos[properties] !== null);

    if (!allPresentProperties) {
      return res.status(400).json({
        isError: true,
        data: null,
        msg: "Por favor, insira todos os valores obrigatórios do usuário."
      });
    }
    
    if (!allTermoPresentProperties) {
      return res.status(400).json({
        isError: true,
        data: null,
        msg: "Por favor, concorde com todos os termos"
      });
    }

    if (!UserController.isAdult(data.dataNascimento)) {
      if (!data.responsavel || !UserController.isAdult(data.responsavel?.dataNascimento)) {
        return res.status(400).json({
          isError: true,
          data: null,
          msg: "Para usuários não adultos, é necessário fornecer um responsável que seja adulto."
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
      const { usuarioId } = req.params
      const id = Number(usuarioId)
      await serviceUser.deleteUsuario(id)
      res.status(200).json({
        isError: false,
        data: null,
        msg: `Deletado com sucesso`
      })
    } catch (error) {
      return res.status(400).json({
        isError: true,
        data: null,
        msg: `Algo deu errado: ${error}`
      });
    }
  }
  public async ReadOnlyUserId(req: Request, res: Response) {}
}

const userController: UserController = new UserController();

export default userController;
