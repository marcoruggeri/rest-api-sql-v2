const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class Course extends Sequelize.Model { }
  Course.init({
    title: {
      type: Sequelize.STRING,
      allownull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allownull: false,
    },
    estimatedTime: {
      type: Sequelize.STRING,
    },
    materialsNeeded: {
      type: Sequelize.STRING,
    },
  }, {sequelize});

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
        field: 'userId',
        allowNull: false,
      }
    });
  };
  return Course;
}