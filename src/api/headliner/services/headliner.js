'use strict';

/**
 * headliner service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::headliner.headliner');
