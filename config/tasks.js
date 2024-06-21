'use strict';

const feedUpdater = require("./feedUpdater");

async function updateFeed() {
  console.log("feed is updating")
  return await feedUpdater.main();
}

module.exports = {
  updateFeed,
};