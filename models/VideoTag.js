module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VideoTag', {
        // Tabela intermediária, o Sequelize já cuida de 'videoId' e 'tagId' pelas associações do index.js
    }, {
        timestamps: false,
        tableName: 'video_tags'
    });
};
