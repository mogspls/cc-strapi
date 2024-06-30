"use strict";
const Parser = require("rss-parser");

module.exports = {
  getHeadlinerfrom: async (url) => {
    const parser = new Parser({
      customFields: {
        item: [
          ["media:content", "contentThumbnail", { keepArray: false }],
          ["media:content", "thumbnail", { keepArray: false }],
        ],
      },
    });

    const diffInDays = (today, pubdate) => {
      const difference = Math.floor(today) - Math.floor(pubdate);
      return Math.floor(difference / 60 / 60 / 24);
    };

    const rss = await parser.parseURL(url);
    //  Format today's date
    const today = new Date().getTime() / 1000;
    return rss.items.filter((item) => {
      const blogPublishedDate = new Date(item.pubDate).getTime() / 1000;
      return diffInDays(today, blogPublishedDate) === 0;
    });
  },
  createNewsItem: async (item) => {

    const getImgSrc = (descriptionImg) => {
      const imgSrcMatch = descriptionImg.match(/<img[^>]+src="([^">]+)"/);
      return imgSrcMatch ? imgSrcMatch[1] : null;
    };

    const entry = await strapi.entityService.create(
      "api::headliner.headliner",
      {
        data: {
          title: item.title,
          description: item.content,
          link: item.link,
          thumbnail: item.thumbnail
            ? item.thumbnail["$"].url
            : item.contentThumbnail
            ? item.contentThumbnail[0].url
            : item.content.toString().match(/<img[^>]+src="([^">]+)"/)[1]
            ? getImgSrc(item.content)
            : "",
          company: item.company,
        },
      }
    );
    console.log(entry);
  },
  main: async function () {
    let allNewFeedItems = [];
    let results = [];
    const response = await strapi.service("api::headline.headline").find();

    // for (let i = 0; i < response.pagination.total; i++) {
    //   const feedItems = await this.getHeadlinerfrom(response.results[i].link);

    //   const feed = feedItems[i].results.forEach((item) => {
    //     item.company = response.results[i].title;
    //   })

    //   console.log(feed.results[i]);

    // allNewFeedItems.push({
    //   company: response.results[i].title,
    //   results: [...feedItems],
    // });

    // await this.createNewsItem(
    //   ...allNewFeedItems[i].results,
    //   allNewFeedItems[i].company
    // );
    // }

    for (let i = 0; i < response.pagination.total; i++) {
      const feed = await this.getHeadlinerfrom(response.results[i].link);

      allNewFeedItems.push({
        company: response.results[i].title,
        results: [...feed],
      });

      allNewFeedItems[i].results.forEach(async (item) => {
        // @ts-ignore
        response.results[i].title = item.company;
      });

      const output = results.concat(...allNewFeedItems[i].results);

      // console.log(output)
      // console.log(
      //   `${response.results[i].link}: ${allNewFeedItems[i].results.length}`
      // );

      console.log(output)

      return output
    }
  },
};
