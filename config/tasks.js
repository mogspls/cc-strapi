"use strict";

const feedUpdater = require("./feedUpdater");

async function updateFeed() {
  console.log("Feed is currently updating");
  return await feedUpdater.main();
}

async function deleteAllPosts() {
  console.log("Feed is currently being deleted");
  return await feedUpdater.deleteAllPosts();
}

module.exports = {
  updateFeed,
  deleteAllPosts,
};
