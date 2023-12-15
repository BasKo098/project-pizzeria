import { select, classNames, templates } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
    constructor(id, data){
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.dom = {}
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    } 

    renderInMenu(){
        const thisProduct = this;
        const generatedHTML = templates.menuProduct(thisProduct.data);
        thisProduct.element = utils.createDOMFromHTML(generatedHTML);
        const menuContainer = document.querySelector(select.containerOf.menu);
        menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;
      
      thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    }

    initAccordion() {
      const thisProduct = this;
      thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
      event.preventDefault();
      const activeProduct = document.querySelector(select.all.menuProductsActive);
    
        if (activeProduct && activeProduct !== thisProduct.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm() {
      const thisProduct = this;
      thisProduct.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.dom.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.dom.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
      thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      let price = thisProduct.data.price;
      let visible = classNames.menuProduct.imageVisible;

      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionImage = thisProduct.dom.imageWrapper.querySelector(`.${paramId}-${optionId}`);

          if (optionImage != null){
            optionImage.classList.remove(visible);
          }
          
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected) {

            if(!option.default) {
              price += parseFloat(option.price); 
            }

            if(optionImage) {
                optionImage.classList.add(visible);
            }

          } else {
            if (option.default) {
              price -= parseFloat(option.price);
            }
            
            if (optionImage) {
                optionImage.classList.remove(visible);
            }
          } 
        }
      }

      thisProduct.priceSingle = price; 
      thisProduct.amount = thisProduct.amountWidget.value;
      price *= thisProduct.amountWidget.value;
      thisProduct.dom.priceElem.innerHTML = price;
    }  

    prepareCartProductParams() {
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};

      // for very category (param)
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {}
        }

        // for every option in this category
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          if(optionSelected) {
            params[paramId].options[optionId] = option.label;
            // option is selected!
          }
        }
      }

      return params;
    }

    prepareCartProduct() {
      const thisProduct = this;
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amount,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,
        params: thisProduct.prepareCartProductParams(),
      };
      return productSummary;
    }

    addToCart() {
      const thisProduct = this;

      //thisProduct.name = thisProduct.data.name;
      //thisProduct.amount = thisProduct.amountWidget.value;

      //  app.cart.add(thisProduct.prepareCartProduct());
      const event = new CustomEvent('add-to-cart', {
        bubbles: true,
        detail: {
          product: thisProduct.prepareCartProduct(),
        },
      }
      );
      thisProduct.element.dispatchEvent(event);
    }
  }

  export default Product;