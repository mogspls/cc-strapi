'use strict';

const tasks = require("./tasks")

module.exports = {
  createPost: {
    task: async ({strapi}) => {
      await tasks.updateFeed();
    },
    options: {
      rule: "0 15 * * * *"
    }
  },
  deleteAllPosts: {
    task: async({strapi}) => {
      await tasks.deleteAllPosts();
    },
    options: {
      rule: "* 0 0 * * *"
    }
  }
};