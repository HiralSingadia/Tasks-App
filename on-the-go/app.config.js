const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const { expo } = require('./app.json');

module.exports = {
  expo: {
    ...expo,
    ios: {
      ...expo.ios,
      config: {
        ...expo.ios?.config,
        googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
      },
    },
  },
};
