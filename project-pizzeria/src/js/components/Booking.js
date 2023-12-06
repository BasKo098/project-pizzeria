import { select, templates } from '../settings.js';
import AmountWidget from './AmountWidget.js';

class Booking {
    constructor(element){
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
    }

    render(element) {
        const thisBooking = this;

        const generatedHTML = templates.bookingWidget(element);
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(
            select.booking.peopleAmount
          );
    }   

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.widgets.booking.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.widgets.booking.hoursAmount);
        
        thisBooking.dom.peopleAmount.addEventListener('click', function(event){
            event.preventDefault();
        })
        thisBooking.dom.hoursAmount.addEventListener('click', function(event){
            event.preventDefault(); 
        });
    }
}
export default Booking;