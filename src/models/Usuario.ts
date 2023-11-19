import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinTable,
} from "typeorm";
import {UsuarioTermo} from "./Aceite";

@Entity({name: "usuario"})
export class Usuario {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  id!: number;

  @Column()
  nome!: string;

  @Column()
  nick!: string;

  @Column()
  email!: string;

  @Column()
  senha!: string;

  @Column()
  cpf!: string;

  @Column({name: "dataNascimento", type: "datetime"})
  dataNascimento!: Date;

  @OneToMany(() => UsuarioTermo, (condicao) => condicao.usuario, {onDelete: "CASCADE"})
  condicoes!: UsuarioTermo;

  @ManyToOne(() => Usuario, (responsavel) => responsavel.usuario, { onDelete: "CASCADE"})
  @JoinTable()
  responsavel!: Usuario;

  @OneToMany(() => Usuario, (usuario) => usuario.responsavel , { onDelete: "CASCADE"})
  usuario!: Usuario;
}
