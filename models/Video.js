module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Video', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        titulo: { type: DataTypes.STRING, allowNull: false },
        resumo_ia: { type: DataTypes.TEXT, allowNull: true },
        link_iframe: { type: DataTypes.STRING, allowNull: false },
        drive_id: { type: DataTypes.STRING, allowNull: false, unique: true },
        duracao: { type: DataTypes.STRING, allowNull: true },
        data_publicacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        timestamps: true,
        tableName: 'videos'
    });
};
