import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";
@Entity({name: "deletados"})
export class Deletados {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  id!: number;

  @Column({name: "usaurio_id"})
  usaurio_id!: number;
}
