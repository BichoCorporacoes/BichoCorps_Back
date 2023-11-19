import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {Usuario} from "./Usuario";
import {Termos} from "./Termos";
@Entity({name: "usuario_termo_condicao"})
export class UsuarioTermo {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  id!: number;

  @CreateDateColumn({
    name: "uso_condicao",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP(6)",
    type: "datetime",
  })
  uso_condicao!: Date;
  
  @Column({
    name: "markting_comunicaoo",
    type: "boolean",
  })
  markting_comunicaoo!: boolean;

  @Column({
    name: "markting_atualizacao",
    type: "boolean",
  })
  markting_atualizacao!: boolean;

  @Column({
    name: "maior_idade",
    default: false,
    type: "boolean",
  })
  maior_idade!: boolean;

  @ManyToOne(() => Usuario, (usaurio) => usaurio.condicoes, {onDelete: "CASCADE"})
  usuario!: Usuario;

  @ManyToOne(() => Termos, (termos) => termos.condicao, {onDelete: "CASCADE"})
  termos!: Termos;

  @ManyToOne(() => Usuario, (responsavel) => responsavel.condicoes, {
    nullable: true,
    onDelete: "CASCADE"
  })
  responsavel!: Usuario;
}
