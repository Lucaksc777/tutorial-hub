module.exports = (sequelize, DataTypes) => {
    return sequelize.define('User', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        nome: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password_hash: { type: DataTypes.STRING, allowNull: false }
    }, {
        timestamps: true,
        tableName: 'users'
    });
};
