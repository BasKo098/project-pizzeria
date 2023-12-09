import { select, settings, templates } from '../settings.js';
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

        //console.log('getData params', params);

        const urls = {
            booking:      settings.db.url + '/' + settings.db.bookings 
                                          + '?' + params.booking.join('&'),
            eventCurrent: settings.db.url + '/' + settings.db.events 
                                          + '?' + params.eventCurrent.join('&'),
            eventRepeat:  settings.db.url + '/' + settings.db.events 
                                          + '?' + params.eventRepeat.join('&'),
        };

       //console.log('getData url', urls);

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
           console.log('bookings', bookings);
           console.log('eventsCurrent', eventCurrent);
           console.log('eventsRepeat', eventRepeat);
        });
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
    }   

    initWidgets() {
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
        
        thisBooking.dom.peopleAmount.addEventListener('updated', function(event) {
            event.preventDefault();
        })
        thisBooking.dom.hoursAmount.addEventListener('updated', function(event) {
            event.preventDefault(); 
        });
    }
}
export default Booking;