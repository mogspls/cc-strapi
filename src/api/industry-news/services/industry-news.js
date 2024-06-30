'use strict';

/**
 * industry-news service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::industry-news.industry-news');
