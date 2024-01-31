const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bodyParser = require("body-parser");
const basicAuth = require('basic-auth');
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname)));
app.use(cors());

const adminCredentials = { 
    username: process.env.ADMIN_USERNAME, 
    password: process.env.ADMIN_PASSWORD 
};

const authMiddleware = (req, res, next) => {
    const user = basicAuth(req);
  
    if (!user || user.name !== adminCredentials.username || user.pass !== adminCredentials.password) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.status(401).send('Unauthorized');
    }
  
    return next();
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const availableTimeSlotsFile = path.join(__dirname, 'availableTimeSlots.json');
let availableTimeSlots = {};
try {
    if (fs.existsSync(availableTimeSlotsFile)) {
        const fileContent = fs.readFileSync(availableTimeSlotsFile, 'utf-8');

        // Check if the file is not empty
        if (fileContent.trim() !== '') {
            availableTimeSlots = JSON.parse(fileContent);
        }
    }
} catch (error) {
    console.error('Error reading or parsing the file:', error.message);
}

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/submit-booking', function (req, res) {
    const selectedDate = req.body.selectedDate;
    const selectedTime = req.body.selectedTime;
    const userEmail = req.body.email;
    
    const bookedTime = parseFloat(selectedTime);
    const bookedDate = availableTimeSlots[selectedDate];

    if (bookedDate) {
        const index = bookedDate.indexOf(bookedTime);
        bookedDate.splice(index, 1);
        if (bookedDate.length === 0) {
            availableTimeSlots[selectedDate] = [];
        }

        // Update the availableTimeSlots in the file
        fs.writeFileSync(availableTimeSlotsFile, JSON.stringify(availableTimeSlots));
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'info@niocell.com',
        subject: 'Centaurlendar Ajanvaraus',
        text: `Palaveri ajalle ${selectedDate} ${selectedTime} varattu! varaaja ${userEmail}`
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          //res.status(500).json({ success: false, message: 'Error sending email' });
        } else {
          console.log('Email sent: ' + info.response);
          //res.json({ success: true, message: `Palaveri ajalle ${selectedDate} ${selectedTime} varattu!` });
        }
    });

    // Process the bookingDate and perform necessary actions
    res.send(`Palaveri ajalle ${selectedDate} ${selectedTime} varattu!`);
});

app.use('/admin', authMiddleware);

app.get('/admin', authMiddleware, function (req, res) {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/update-time-slots', function (req, res) {
    const selectedDate = req.body.selectedDate;
    const timeSlots = req.body.timeSlots.split(',').map(Number);

    // Update availableTimeSlots for the selected date
    availableTimeSlots[selectedDate] = timeSlots;

    try {
        // Write updated availableTimeSlots to the file
        fs.writeFileSync(availableTimeSlotsFile, JSON.stringify(availableTimeSlots));
        res.send(`Time slots for ${selectedDate} updated: ${timeSlots}`);
    } catch (error) {
        console.error('Error writing to the file:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/get-available-time-slots', function (req, res) {
    // Read the JSON file
    fs.readFile(availableTimeSlotsFile, 'utf8', function (err, data) {
        if (err) {
            console.error('Error reading availableTimeSlots.json:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        try {
            // Parse the JSON data
            const availableTimeSlots = JSON.parse(data);

            // Log the contents to the console
            console.log('availableTimeSlots:', availableTimeSlots);

            // Send the data to the client
            res.json(availableTimeSlots);
        } catch (parseError) {
            console.error('Error parsing availableTimeSlots.json:', parseError);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});

const server = app.listen(PORT, function () {
    console.log('Node server is running..');
});