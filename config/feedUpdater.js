"use strict";
const { JSDOM } = require("jsdom");
const { DOMParser, XMLSerializer } = require('xmldom');
const { deleteAllPosts } = require("./cron-tasks");
const entities = require("entities");

module.exports = {
  fetchData: async (api) => {
    const res = await strapi.service(api).find();
    /*
      // Format it into this format
      { name: "GMA", url: "https://data.gmanetwork.com/gno/rss/news/feed.xml" },
    */
    const sources = res.results
      .filter((item) => item.enabled) // Check if "enabled" is true
      .map((item) => ({
        name: item.title,
        url: item.link,
      }));

    const responses = await Promise.all(
      sources.map((source) => fetch(source.url))
    );

    const xmlDataArray = await Promise.all(
      responses.map((response) => response.text())
    );

    const parseXMLData = (xmlData) => {
      const dom = new JSDOM(xmlData, { contentType: "application/xml" });
      return dom.window.document;
    };

    const extractImageSrc = (content) => {
      const imgTagRegex = /<img [^>]*src="([^"]+)"[^>]*>/;
      const match = content.match(imgTagRegex);
      return match ? match[1] : null;
    };

    const checkXMLValidity = (xmlString) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "application/xml");

        // Check for parsing errors
        if (doc.getElementsByTagName("parsererror").length > 0) {
          console.log("Invalid XML detected:");
          // const error = doc.getElementsByTagName("parsererror")[0];
          // console.log(error.textContent);

        } else {
          // Serialize the XML document back to a string and return it
          const serializer = new XMLSerializer();
          const xmlString = serializer.serializeToString(doc);
          // console.log("XML is valid.");
          // console.log("Serialized XML:", xmlString);
          return xmlString;
        }
      } catch (error) {
        console.error("Error while parsing XML:", error.message);
      }
    };

    const removeAllHtmlTags = (content) => {
      const withoutImgTags = content.replace(/<img[^>]*>/g, "");
      const withoutBrTags = withoutImgTags.replace(/<br\s*\/?>/g, "");
      const withoutHtmlTags = withoutBrTags.replace(/<\/?[^>]+(>|$)/g, "");
      const withoutNewlines = withoutHtmlTags.replace(/\n/g, "");
      return entities.decode(withoutNewlines);
    };

    const combinedNews = xmlDataArray.reduce((acc, xmlData, index) => {

      const validXML = checkXMLValidity(xmlData);

      const xml = parseXMLData(validXML);
      const items = xml.querySelectorAll("item");

      const itemsWithSource = Array.from(items).map((item) => {
        const descriptionContent =
          item.querySelector("description").textContent;

        const thumbnail =
          item
            .getElementsByTagName("media:thumbnail")[0]
            ?.getAttribute("url") ||
          item.getElementsByTagName("media:content")[0]?.getAttribute("url") ||
          extractImageSrc(descriptionContent);

        return {
          title: item.querySelector("title").textContent,
          description: removeAllHtmlTags(descriptionContent),
          link: item.querySelector("link").textContent,
          thumbnail: thumbnail,
          company: sources[index].name,
        };
      });

      return [...acc, ...itemsWithSource];
    }, []);

    return combinedNews;
  },
  createNewsItem: async (model, data, filter, duplicateCounter) => {
    try {
      // Check if the post already exists
      const existingEntry = await strapi.entityService.findMany(model, {
        filters: filter,
      });

      if (existingEntry.length === 0) {
        // Log the data being posted to help identify issues
        // console.log("Creating new post with data:", data);

        // If the post doesn't exist, create a new one
        const entry = await strapi.entityService.create(model, {
          data,
        });

        console.log(`Created new post: ${entry.title}`);
      } else {
        duplicateCounter.count += 1; // Increment the duplicate counter
      }
    } catch (error) {
      console.error(`Error creating post: ${error.message}`);
    }
  },
  deleteAllPosts: async () => {
    const headliners = await strapi.entityService.findMany(
      "api::headliner.headliner"
    );

    const industrynews = await strapi.entityService.findMany(
      "api::industry-news.industry-news"
    );

    for (const item of headliners) {
      await strapi.entityService.delete("api::headliner.headliner", item.id);
    }

    for (const item of industrynews) {
      await strapi.entityService.delete(
        "api::industry-news.industry-news",
        item.id
      );
    }

    console.log("Deleted all posts. Refreshing everything.");
  },
  main: async function () {
    const duplicateCounter = { count: 0 }; // Initialize the duplicate counter
    const headlinesRSS = await this.fetchData("api::headline.headline");

    for (const item of headlinesRSS) {
      const duplicateLinks = { link: item.link };
      await this.createNewsItem(
        "api::headliner.headliner",
        item,
        duplicateLinks,
        duplicateCounter
      );
    }

    console.log(`Number of duplicate posts: ${duplicateCounter.count}`);

    // // Industry News
    const industryNewsRSS = await this.fetchData(
      "api::rss-industry.rss-industry"
    );

    for (const item of industryNewsRSS) {
      const uniqueFilter = { link: item.link };
      await this.createNewsItem(
        "api::industry-news.industry-news",
        item,
        uniqueFilter,
        duplicateCounter
      );
    }
  },
};
