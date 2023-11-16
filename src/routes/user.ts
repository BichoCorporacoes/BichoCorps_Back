/* 
    Rotas:
        Usuario:
            Login:
                JWT, Email, Senha
            Cadastro:
                Todas as informações do usuario, porém caso ele não seja maior de idade ele fala que é obrigatorio a
                inserção de um responsavel.
                Fazer com que ele aceite o termos, caso não aceite o termo, retorna nullo.
                Fazer validação do CPF e de data de nascimento.
                Caso ele não aceite um dos termos não efetuar o cadastro.
            Delete:
                Inserção do ID do usuario na tebela de deletados
*/
import { Router } from 'express';
import { userController } from '../controllers';

const user = Router();

user.post('/CreateUser', userController.CreateUser);
user.delete('/DeleteUser/:usuarioId', userController.Deleteuser);
user.get('/ReadOnlyUser', userController.ReadOnlyUserId);

export default user;

