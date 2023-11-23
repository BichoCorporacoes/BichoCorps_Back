import { DataSource, EntityMetadata, ObjectLiteral } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { StorageReference, getDownloadURL, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { DataBaseSource } from "../config/database";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../config/firebase";
import { IPromiseResponse } from "../interfaces/promises";

dotenv.config();

class DumpService {
   private async createTableQueries() {
      const queryRunner = DataBaseSource.createQueryRunner();
      await queryRunner.startTransaction();
      const entities = await Promise.all(
         DataBaseSource.entityMetadatas.map(async (entity) => {
            const createTableSql = await queryRunner.query(`SHOW CREATE TABLE ${entity.tableName}`);
            createTableSql[0]["Create Table"] = createTableSql[0]["Create Table"].replace("COLLATE=utf8mb4_0900_ai_ci", "");
            createTableSql[0]["Create Table"] += ";\n";
            return createTableSql[0]["Create Table"].replace(
               "CREATE TABLE",
               `\n-- SECTION_DELIMITER --\n-- Create Table\nCREATE TABLE IF NOT EXISTS`,
            );
         }),
      );
      return entities;
   }

   private getColumns(item: ObjectLiteral, entity: EntityMetadata) {
      let sql = "";
      sql += Object.keys(item)
         .filter((columnName) => {
            return entity.columns.some((column) => column.propertyName === columnName);
         })
         .map((columnName) => {
            const relatedColumn = entity.columns.find((column) => column.propertyName === columnName);
            if (relatedColumn?.relationMetadata) {
               return columnName + "Id";
            }
            return columnName;
         })
         .join(", ");
      return sql;
   }

   private getValues(item: ObjectLiteral, entity: EntityMetadata) {
      let sql = "";
      sql += Object.values(item)
         .filter((value, index) => {
            return entity.columns[index] !== null && entity.columns[index] !== undefined;
         })
         .map((value, index) => {
            if (Array.isArray(value)) {
               return value.length > 0 ? value[0] : "null";
            }
            const columnType = entity.columns[index].type;
            if (columnType === "datetime") {
               const formattedDate = value instanceof Date ? value.toISOString().slice(0, 19).replace("T", " ") : value;
               return typeof formattedDate === "string" ? `'${formattedDate}'` : formattedDate;
            }
            return typeof value === "string" ? `'${value}'` : value;
         })
         .join(", ");
      return sql;
   }

   private async createInserts() {
      let sql = "";
      const entities = DataBaseSource.entityMetadatas;
      for (const entity of entities) {
         const tableName = entity.tableName;
         const repository = DataBaseSource.getRepository(entity.target);
         const data = await repository.find({
            loadRelationIds: true,
            relationLoadStrategy: "join",
            loadEagerRelations: true,
         });
         if (data.length > 0) {
            const insertStatements = await Promise.all(
               data.map(async (item) => {
                  const columns = await this.getColumns(item, entity);
                  const values = await this.getValues(item, entity);
                  return `-- SECTION_DELIMITER --\n-- ${tableName} Start --\n-- Insert ${entity.tableName}\nINSERT IGNORE INTO ${entity.tableName} (${columns}) VALUES (${values});\n-- ${tableName} End --\n`;
               }),
            );
            sql += `\n${insertStatements.join("\n")}\n`;
         }
      }
      return sql;
   }

   private async findTableSections(tableName: string, sqlContent: string) {
      const startDelimiter = `-- ${tableName} Start --`;
      const endDelimiter = `-- ${tableName} End --`;
      const sections = sqlContent.split("-- SECTION_DELIMITER --");
      const ids = (await this.getUsersDeleted()).map(String); // Converte IDs para strings
      const tableSections = sections
         .map((section) => section.trim())
         .filter((section) => {
            if (section.includes(startDelimiter) && section.includes(endDelimiter)) {
               const valuesStartIndex = section.indexOf("VALUES (") + "VALUES (".length;
               const valuesEndIndex = section.indexOf(");", valuesStartIndex);
               const valuesSection = section.substring(valuesStartIndex, valuesEndIndex).trim();
               const valuesArray = valuesSection.split(",").map((value) => value.trim());
               const idValue = valuesArray[0];
               return !ids.includes(idValue);
            }
            return true;
         });
      return tableSections;
   }

   private async getUsersDeleted() {
      const ids: number[] = [];
      const docRef = doc(db, "deletados", "KOXlc4U2oQ2WvyM6J3gQ");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
         const idArray = docSnap.data()?.id;
         if (Array.isArray(idArray)) {
            idArray.forEach((item) => {
               const usaurioId = item?.usaurio_id;
               if (usaurioId !== undefined) {
                  ids.push(usaurioId);
               }
            });
         }
      }
      return ids;
   }

   private async getLinkBackUp(sql: string) {
      const currentDate = new Date();
      const unixTimestamp = Math.floor(currentDate.getTime() / 1000);
      const fileName = `dump_${unixTimestamp}.sql`;
      const filePath = `./${fileName}`;
      fs.writeFileSync(filePath, sql);
      let fileData = fs.readFileSync(filePath);
      const storageRef = ref(storage, fileName);
      await uploadBytesResumable(storageRef, fileData);
      const uploadTask = uploadBytesResumable(storageRef, fileData.buffer);
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      // fs.unlinkSync(filePath);
      return downloadURL;
   }

   public async createDump() {
      const queryRunner = DataBaseSource.createQueryRunner();
      await queryRunner.startTransaction();
      let sql = "";
      try {
         sql += JSON.stringify(await DataBaseSource.driver.createSchemaBuilder().log());
         const createTableQueries = await this.createTableQueries();
         sql += `\n${createTableQueries.join("\n")}\n`;
         sql += await this.createInserts();
         await queryRunner.commitTransaction();
      } catch (error) {
         console.error(error);
         await queryRunner.rollbackTransaction();
         return {
            data: null,
            isError: true,
            msg: "Erro ao restaurar o banco de dados.",
            msgError: error,
         };
      } finally {
         await queryRunner.release();
         const url = await this.getLinkBackUp(sql);
         return {
            data: url,
            isError: false,
            msg: "Banco de dados restaurado com sucesso!",
         };
      }
   }
   public async restoreDatabase(sql: Express.Multer.File): Promise<IPromiseResponse> {
      const bufferData = sql.buffer;
      let sqlContent = bufferData.toString("utf-8");
      const expectedStructure = '{"upQueries":[],"downQueries":[]}';
      if (sqlContent.startsWith(expectedStructure)) {
         sqlContent = sqlContent.substring(expectedStructure.length).trim();
      }
      const queryRunner = DataBaseSource.createQueryRunner();
      const tableSections = await this.findTableSections("usuario", sqlContent);
      try {
         await queryRunner.startTransaction();
         for (let section of tableSections) {
            section = section
               .split("\n")
               .filter((line) => !line.trim().startsWith("--"))
               .join("\n");
            if (section.trim() !== "") {
               await queryRunner.query(section);
            }
         }
         await queryRunner.commitTransaction();
      } catch (error: any) {
         await queryRunner.rollbackTransaction();
         return {
            data: null,
            isError: true,
            msg: "Erro ao restaurar o banco de dados.",
            msgError: error,
         };
      } finally {
         await queryRunner.release();
         return {
            data: null,
            isError: false,
            msg: "Banco de dados restaurado com sucesso!",
         };
      }
   }
}
export default new DumpService();
