module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Tag', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        nome: { type: DataTypes.STRING, allowNull: false, unique: true }
    }, {
        timestamps: false,
        tableName: 'tags'
    });
};
