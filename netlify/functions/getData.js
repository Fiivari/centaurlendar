// functions/getData.js

const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Construct the absolute path to your JSON file
    const jsonFilePath = path.resolve(__dirname, '../your-json-file.json');
    
    // Require the JSON file
    const data = require(jsonFilePath);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
