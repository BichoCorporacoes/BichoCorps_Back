import {Repository} from "typeorm";
import {DataBaseSource} from "../config/database";
import {Deletados, Termos, Usuario, UsuarioTermo} from "../models";
import {ICreateUsuario} from "../interfaces/usuario";
import { IPromiseResponse } from "../interfaces/promises";
import { IReqTermos } from "../interfaces/termos";

class UserService {
  private repository: Repository<Usuario>;
  private usuarioTermoRepository: Repository<UsuarioTermo>
  private termoRepository: Repository<Termos>
  private deletedRepository: Repository<Deletados>
  constructor() {
    this.repository = DataBaseSource.getRepository(Usuario);
    this.usuarioTermoRepository = DataBaseSource.getRepository(UsuarioTermo);
    this.termoRepository = DataBaseSource.getRepository(Termos);
    this.deletedRepository = DataBaseSource.getRepository(Deletados)
  }
  private async createResponsavel(responsavel: ICreateUsuario): Promise<number> {
    const repositorio = this.repository;
    try {
      const insert = repositorio.create(responsavel);
      const resp = await repositorio.save(insert);
      return resp.id;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async deleteUsuario(usuarioId: number){
    const user = await this.repository.findOne({ where: { id : usuarioId }, relations: { responsavel: true } })
    await this.repository.createQueryBuilder().where("id = :usuarioId", { usuarioId }).delete().execute()
    await this.repository.createQueryBuilder().where("id = :usuarioId", { usuarioId: user?.responsavel.id }).delete().execute()
    const deletedData: { usaurio_id: number }[] = [
      { usaurio_id: usuarioId },
      user ? { usaurio_id: user?.responsavel.id } : undefined
    ].filter(Boolean) as { usaurio_id: number }[];
    console.log(deletedData)
    await this.deletedRepository.createQueryBuilder()
      .insert()
      .into(Deletados)
      .values(deletedData)
      .execute();
    
  }

  private async createTermo(usaurioId: number, termos: IReqTermos, responsavelId?: number): Promise<void> {
    const lastRegister = await this.termoRepository.findOne({
      order: {
        id: "DESC",
      },
      where: {}
    });
    const data = {
      uso_condicao: termos.uso_condicao,
      markting_comunicaoo: termos.markting_comunicaoo,
      markting_atualizacao: termos.markting_atualizacao,
      maior_idade: responsavelId ? true : false,
      usuario: { id: usaurioId },
      responsavel: responsavelId ? { id: responsavelId } : undefined,
      termos: { id: lastRegister?.id }
    }
    const insert = this.usuarioTermoRepository.create(data)
    await this.usuarioTermoRepository.save(insert);
  }

  public async createUser(user: ICreateUsuario, termos: IReqTermos, responsavel?: ICreateUsuario): Promise<IPromiseResponse> {
    const repositorio = this.repository;
    try {
      let respId: number | undefined;
      if (responsavel) respId = await this.createResponsavel(responsavel);
      const userEntity = this.repository.create({
        nome: user.nome,
        nick: user.nick,
        email: user.email,
        senha: user.senha,
        cpf: user.cpf,
        dataNascimento: user.dataNascimento,
        responsavel: respId ? { id: respId } : undefined,
      });
      await repositorio.save(userEntity);
      await this.createTermo(userEntity.id, termos, respId)
      return { data: userEntity, isError: false, msg: "Usuário cadastrado com sucesso!" };
    } catch (error: any) {
      return { data: null, isError: true, msg: `Erro ao cadastrar o usuário: ${error.message || error}` };
    }
  }

}

export default new UserService();
