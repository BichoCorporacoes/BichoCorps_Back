import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Usuario } from "./Usuario";

@Entity({ name: "logs" })
export class Log {
   @PrimaryGeneratedColumn()
   id!: number;

   @Column({
      type: "text",
   })
   msg!: string;

   @ManyToMany(() => Usuario)
   @JoinTable()
   usuario!: Usuario;
}
