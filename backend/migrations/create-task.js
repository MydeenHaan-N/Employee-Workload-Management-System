module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tasks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('High', 'Medium', 'Low'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Pending', 'In Progress', 'Completed', 'Overdue'),
        defaultValue: 'Pending'
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: false
      },
      assignedTo: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tasks');
  }
};