import { classNames, select, settings, templates } from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element){
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
        thisBooking.selected = {};
    }

    getData() {
        const thisBooking = this;
        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventRepeat: [
                settings.db.repeatParam,
                endDateParam,            
            ],
        };

        const urls = {
            booking:      settings.db.url + '/' + settings.db.bookings 
                                          + '?' + params.booking.join('&'),
            eventCurrent: settings.db.url + '/' + settings.db.events 
                                          + '?' + params.eventCurrent.join('&'),
            eventRepeat:  settings.db.url + '/' + settings.db.events 
                                          + '?' + params.eventRepeat.join('&'),
        };

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventCurrent),
            fetch(urls.eventRepeat),
        ])

        .then(function(allResponses){
            const bookingsResponse = allResponses[0];
            const eventCurrentResponse = allResponses[1];
            const eventRepeatResponse = allResponses[2];
            return Promise.all([
            bookingsResponse.json(),
            eventCurrentResponse.json(),
            eventRepeatResponse.json(),
            ]);
        })
        .then(function([bookings, eventCurrent, eventRepeat]){
           thisBooking.parseData(bookings, eventCurrent,eventRepeat);
        });
    }

    parseData(bookings, eventCurrent, eventRepeat){
        const thisBooking = this;

        thisBooking.booked = {};
        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table)
        }

        for(let item of eventCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table)
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;
        for(let item of eventRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table)
                }
            }
        }
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        if(typeof thisBooking.booked[date] == 'undefined'){
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
           if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
            thisBooking.booked[date][hourBlock] = [];
        }
        thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM(){
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ){
            allAvailable = true;
        }
        for (let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)){
                tableId = parseInt(tableId);
            } 
            if (!allAvailable &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ){
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }
    
    render(element) {
        const thisBooking = this;

        const generatedHTML = templates.bookingWidget(element);
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.widgets.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.widgets.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.amount.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.amount.hourPicker.wrapper);    
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.widgets.booking.tables);
        thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.widgets.booking.floorPlan);
        thisBooking.dom.bookingButton =  thisBooking.dom.wrapper.querySelector(select.widgets.booking.bookingButton);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.widgets.booking.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.widgets.booking.address);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.widgets.booking.starters);
    }   

    initWidgets() {
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
        
        
        thisBooking.dom.peopleAmount.addEventListener('updated', function(event) {
            event.preventDefault();
        });
        thisBooking.dom.hoursAmount.addEventListener('updated', function(event) {
            event.preventDefault(); 
        });

        thisBooking.dom.wrapper.addEventListener('updated', function() {
            thisBooking.removeTables();
            thisBooking.updateDOM();
        });

        thisBooking.dom.floorPlan.addEventListener('click', function(event) {
            thisBooking.initTables(event);
        });
    }

    removeTables() {
        const thisBooking = this;
     
         for (let table of thisBooking.dom.tables) {
           table.classList.remove(classNames.booking.tableSelected);
         }
       }

    initTables(event) {
        const thisBooking = this;
        const tableId = event.target.getAttribute('data-table');
        const isBooked = event.target.classList.contains(classNames.booking.tableBooked);
        const isSelected = event.target.classList.contains(classNames.booking.tableSelected);

        if (tableId) {
            if(isBooked) {
                alert('This table is already booked. Chose another table');
            } else if (isSelected) {
                event.target.classList.remove(classNames.booking.tableSelected);
                thisBooking.selected = {};
            } else if (!isSelected) {
                event.target.classList.add(classNames.booking.tableSelected);
                thisBooking.selected = tableId;
            }
        }
    }

    sendBooking() {
        const thisBooking = this;
        const url = settings.db.url + '/' + settings.db.bookings;
        const payload = {
          date: thisBooking.datePicker.value,
          hour: thisBooking.hourPicker.value,
          table: parseInt(thisBooking.selected),
          duration: parseInt(thisBooking.hoursAmount.value),
          ppl: parseInt(thisBooking.peopleAmount.value),
          starters: [],
          phone: thisBooking.dom.phone.value,
          address: thisBooking.dom.address.value,
        };
    
        for (let starter of thisBooking.dom.starters) {
          if (starter.checked) {
            payload.starters.push(starter.value);
          }
        }
    
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        };
        fetch(url, options)
          .then(function (response) {
            return response.json();
          }).then(function () {
            thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
          })
          .catch (function (error) {
            alert("Something went wrong, please try again: ", error);
          });
      }
    }

export default Booking;