const fs = require('fs');
const path = require('path');

const availableTimeSlotsFile = path.join(__dirname, '../availableTimeSlots.json');

exports.handler = async (event, context) => {
  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(availableTimeSlotsFile, 'utf8');

    // Parse the JSON data
    const availableTimeSlots = JSON.parse(fileContent);

    // Return the data to the client
    return {
      statusCode: 200,
      body: JSON.stringify(availableTimeSlots),
    };
  } catch (error) {
    console.error('Error reading or parsing the file:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
