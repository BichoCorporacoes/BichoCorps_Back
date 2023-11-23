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

interface IResponsavel {
   nome: string;
   nick: string;
   email: string;
   senha: string;
   cpf: string;
   dataNascimento: Date;
}
export interface IUsuario {
   nome: string;
   nick: string;
   email: string;
   senha: string;
   cpf: string;
   dataNascimento: Date;
   responsavel?: IUsuarioResponsavel;
}

export interface RequestLogin {
   email: string;
   senha: string;
}
