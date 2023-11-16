import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {UsuarioTermo} from "./Aceite";

@Entity({name: "termos"})
export class Termos {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  id!: number;

  @Column({
    name: "versao",
    type: "text",
  })
  versao!: string;

  @Column({
    name: "uso_condicao",
    type: "text",
  })
  uso_condicao!: string;
  
  @Column({
    name: "markting_comunicaoo",
    type: "text",
  })
  markting_comunicaoo!: string;
  
  @Column({
    name: "markting_atualizacao",
    type: "text",
  })
  markting_atualizacao!: string;
  
  @Column({
    name: "maior_idade",
    type: "text",
  })
  maior_idade!: string;
  
  @OneToMany(() => UsuarioTermo, (condicao) => condicao.termos)
  condicao!: UsuarioTermo;
}
