export interface ICreateUsuario {
  nome: string;
  nick: string;
  email: string;
  senha: string;
  cpf: string;
  dataNascimento: Date;
  responsavel?: ICreateUsuario;
}

interface IUsuarioResponsavel {
  nome: string;
  nick: string;
  email: string;
  senha: string;
  cpf: string;
  dataNascimento: Date;
  usuario?: IUsuario;
}

interface IUsuario {
  nome: string;
  nick: string;
  email: string;
  senha: string;
  cpf: string;
  dataNascimento: Date;
  responsavel?: IUsuarioResponsavel;
}
