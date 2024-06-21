"use strict";

const Parser = require("rss-parser");

// 1
function diffInDays(date1, date2) {
  const difference = Math.floor(date1) - Math.floor(date2);
  return Math.floor(difference / 60 / 60 / 24);
}

// 2
async function getNewFeedItemsFrom(feedUrl) {
  const parser = new Parser({
    customFields: {
      item: ["media:content"],
    },
  });
  const rss = await parser.parseURL(feedUrl);
  const todaysDate = new Date().getTime() / 1000;
  return rss.items.filter((item) => {
    const blogPublishedDate = new Date(item.pubDate).getTime() / 1000;
    return diffInDays(todaysDate, blogPublishedDate) === 0;
  });
}

// async function getFeedUrls() {
//   return await strapi.service("api::headline.headline").find();
// }

// 4
async function getNewFeedItems() {
  let allNewFeedItems = [];

  const feeds = await strapi.service("api::headline.headline").find();

  for (let i = 0; i < feeds.total; i++) {
    // const { link } = await feeds.results[i];
    // const feedItems = await getNewFeedItemsFrom(link);
    // allNewFeedItems = [...allNewFeedItems, ...feedItems];
    console.log(i)
    console.log(feeds.results[i])
  }

  console.log("Done!")

  return allNewFeedItems;
}

async function createNewsItem(item) {
  const { title, contentSnippet: preview, link, creator, media } = item;
  let featuredImage = null;

  if (media && media["media:content"]) {
    const imageUrl = media["media:content"]["$"].url;

    const response = await strapi.plugins["upload"].services.upload.fetch({
      url: imageUrl,
    });

    if (response && response.length > 0) {
      featuredImage = response[0];
    }
  }

  const newsItem = {
    title,
    preview,
    link,
    creator,
    sponsored: false,
    featuredImage,
  };

  await strapi.service('api::headliners.headliners').create(newsItem);
}

// 5

// 6
module.exports = {
  main: async () => {
    const feedItems = await getNewFeedItems();

    for (let i = 0; i < feedItems.length; i++) {
      const item = feedItems[i];
      await createNewsItem(item);
    }
  },
};
