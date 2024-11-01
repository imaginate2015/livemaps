const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'mapp-app-live-feed',
  location: 'asia-east1'
};
exports.connectorConfig = connectorConfig;

