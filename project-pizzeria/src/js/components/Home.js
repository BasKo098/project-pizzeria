import {select, templates} from '../settings.js';
import {utils} from '../utils.js';

class Home {
    constructor(element) {
    const thisHome = this;

        thisHome.render(element);
        thisHome.getElement(element);
        thisHome.initCarousel();
    }

    getElement(element) {
        const thisHome = this;
        
        thisHome.dom = {};
        thisHome.dom.wrapper = element;
        thisHome.dom.carousel = thisHome.dom.wrapper.querySelector(select.containerOf.carousel);

    }

    render(element) {
        const generatedHTML = templates.home();
        //console.log('generateHTML ', generatedHTML);
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        element.appendChild(generatedDOM);
    }   

    initCarousel() {
        const thisHome = this;

            const options = {
              cellAlign: 'center',
              contain: true,
              autoPlay: 3000,
              wrapAround: true,
              prevNextButtons: false,
              groupCells: '1',
            };
            // eslint-disable-next-line no-undef
            new Flickity(thisHome.dom.carousel, options);
    } 
}

export default Home;
