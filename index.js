function updateCalendar() {
    const selectedMonth = document.getElementById('monthSelector').value;
    const selectedYear = document.getElementById('yearSelector').value;
    const calendarDiv = document.getElementById('calendar');

    // Fetch availableTimeSlots data from the server
    fetch('/.netlify/functions/get-available-time-slots')
        .then(response => response.json())
        .then(data => {
            const availableTimeSlots = data;

            const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
            const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();

            let calendarHTML = '<table>';
            calendarHTML += '<tr><th>Ma</th><th>Ti</th><th>Ke</th><th>To</th><th>Pe</th><th>La</th><th>Su</th></tr>';

            let dayCounter = 1;
            let weekCounter = 0;

            while (dayCounter <= daysInMonth) {
                calendarHTML += '<tr>';
                for (let j = 1; j < 8; j++) {
                    const currentDate = new Date();
                    const isPastDay = new Date(selectedYear, selectedMonth - 1, dayCounter + 1) < currentDate;

                    if ((weekCounter === 0 && j < firstDayOfMonth) || dayCounter > daysInMonth) {
                        calendarHTML += `<td class="${isPastDay ? 'past-date' : ''} empty-cell"></td>`;
                    } else {
                        const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${dayCounter.toString().padStart(2, '0')}`;

                        const hasAvailableTimeSlots = availableTimeSlots[formattedDate] && availableTimeSlots[formattedDate].length > 0;

                        calendarHTML += `<td class="${isPastDay ? 'past-date' : ''} ${hasAvailableTimeSlots ? 'has-times' : ''}" data-day="${dayCounter}" onclick="selectDate(${dayCounter})">${dayCounter}</td>`;
                        dayCounter++;
                    }
                }
                calendarHTML += '</tr>';
                weekCounter++;
            }

            calendarHTML += '</table>';
            calendarDiv.innerHTML = calendarHTML;


            // Update time slots based on the received data
            generateTimeSlots(availableTimeSlots);
        })
        .catch(error => {
            console.error('Error fetching availableTimeSlots:', error);
        });
}

function selectDate(day) {
    const selectedDateInput = document.getElementById('selectedDate');
    const selectedMonth = document.getElementById('monthSelector').value;
    const selectedYear = document.getElementById('yearSelector').value;
    const bottomCalendar = document.querySelector('.bottom-calendar');

    // Format the date as needed
    const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    selectedDateInput.value = formattedDate;

    const dateCells = document.querySelectorAll('#calendar td');
    dateCells.forEach(cell => cell.classList.remove('selected-date'));

    // Find the selected date cell and add the "selected-date" class
    const selectedDateCell = document.querySelector(`#calendar td[data-day="${day}"]`);
    if (selectedDateCell) {
        selectedDateCell.classList.add('selected-date');
    }

    // Make the bottom part visible
    bottomCalendar.style.display = 'block';

    selectTimeSlot('');

    // Fetch availableTimeSlots data from the server and update time slots
    fetch('/get-available-time-slots')
        .then(response => response.json())
        .then(data => {
            generateTimeSlots(data);
        })
        .catch(error => {
            console.error('Error fetching availableTimeSlots:', error);
        });
}

function generateTimeSlots(availableTimeSlots) {
    const timeSlotsDiv = document.getElementById('timeSlots');
    const selectedDate = document.getElementById('selectedDate').value;

    // Check if available time slots are defined for the selected date
    const dayTimeSlots = (availableTimeSlots && availableTimeSlots[selectedDate]) || [];

    let timeSlotsHTML = '<h2>Valitse aika:</h2>';
    if (dayTimeSlots.length === 0) {
        // If no time slots are set, disable the submit button
        document.querySelector('form input[type="submit"]').disabled = true;
        timeSlotsHTML += `Ei aikoja tälle päivälle`;
    } else {
        // If time slots are set, enable the submit button
        document.querySelector('form input[type="submit"]').disabled = false;
    }

    for (const timeSlot of dayTimeSlots) {
        timeSlotsHTML += `<div class="time-slot bookable" onclick="selectTimeSlot(${timeSlot})">${formatTime(timeSlot)}</div>`;
    }

    timeSlotsDiv.innerHTML = timeSlotsHTML;
}

function selectTimeSlot(hour) {
    const selectedTimeInput = document.getElementById('selectedTime');
    selectedTimeInput.value = formatTime(hour);
}

function formatTime(hour) {
    if (hour === '') {
        return ''
    }
    const formattedHour = Math.floor(hour);
    const formattedMinutes = (hour % 1 === 0.5) ? '30' : '00';

    const nextHour = (formattedHour + (formattedMinutes === '30' ? 1 : 0)).toString().padStart(2, '0');
    const nextMinutes = (formattedMinutes === '30' ? '00' : '30');

    return `${formattedHour.toString().padStart(2, '0')}:${formattedMinutes} - ${nextHour}:${nextMinutes}`;
}

// Set default values and update calendar on page load
document.addEventListener('DOMContentLoaded', function () {
    const currentDate = new Date();
    const defaultMonth = currentDate.getMonth() + 1; // Months are zero-based
    const defaultYear = currentDate.getFullYear();

    document.getElementById('monthSelector').value = defaultMonth.toString();
    document.getElementById('yearSelector').value = defaultYear.toString();

    updateCalendar();
});

// Submit success actions
document.querySelector('#bookingForm').addEventListener('submit', function(event){
    event.preventDefault();
    const selectedDate = document.querySelector('#selectedDate').value;
    const selectedTime = document.querySelector('#selectedTime');
    const userEmail = document.querySelector('#email').value;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/submit-booking');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            selectedTime.value = 'Aika varattu. Otamme yhteyttä sähköpostilla';
        }
        else {
            console.error('Error fetching availableTimeSlots:', xhr.statusText);
        }
    };
    xhr.onerror = function() {
        console.error('Error fetching availableTimeSlots:', xhr.statusText);
    };
    xhr.send(`selectedDate=${selectedDate}&selectedTime=${selectedTime.value}&email=${userEmail}`);
});

