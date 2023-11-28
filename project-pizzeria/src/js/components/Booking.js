import { select, templates } from '../settings.js';
import AmountWidget from './AmountWidget.js';



class Booking {
    constructor(element)  {
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
    }

    getElement() {
        const thisBooking = this;
        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);   
    }

    render(element) {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget(element);
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
    }   

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.peopleAmount.addEventListener('click', function(event){
            event.preventDefoult();

        })
        thisBooking.dom.hoursAmount.addEventListener('click', function(event){
            event.preventDefoult();
            
        });
    }
}
export default Booking;