const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
});

const User = require('./User')(sequelize, DataTypes);
const Video = require('./Video')(sequelize, DataTypes);
const Tag = require('./Tag')(sequelize, DataTypes);
const VideoTag = require('./VideoTag')(sequelize, DataTypes);

// Many-to-Many Associations
Video.belongsToMany(Tag, { through: VideoTag, foreignKey: 'videoId' });
Tag.belongsToMany(Video, { through: VideoTag, foreignKey: 'tagId' });

module.exports = {
    sequelize,
    User,
    Video,
    Tag,
    VideoTag
};
