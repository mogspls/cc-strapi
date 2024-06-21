'use strict';

const tasks = require("./tasks")

module.exports = {
  createPost: {
    task: async ({strapi}) => {
      console.log("Running Headliners RSS Feed CRON")
      await tasks.updateFeed();
    },
    options: {
      rule: "1 * * * * *"
    }
  }
};