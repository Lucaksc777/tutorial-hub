const bcrypt = require('bcrypt');
const { sequelize, User } = require('./models');

async function createAdmin() {
    try {
        // Tenta conectar ao banco
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida.');

        // Sincroniza as tabelas caso ainda não existam
        await sequelize.sync();

        const email = 'admin@email.com';
        const password = '8090';
        const nome = 'Admin';

        // Verifica se o usuário já existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.log('O usuário administrador já existe no banco de dados!');
            process.exit(0);
        }

        // Criptografa a senha "8090"
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Cria o usuário
        await User.create({ nome, email, password_hash });

        console.log('\n✅ Usuário administrador criado com sucesso!');
        console.log(`📧 E-mail: ${email}`);
        console.log(`🔑 Senha: ${password}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar usuário administrador:');
        console.error(error.message);
        process.exit(1);
    }
}

createAdmin();
