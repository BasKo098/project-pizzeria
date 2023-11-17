/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

const select = {
  templateOf: {
    menuProduct: "#template-menu-product",
    cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
      // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };


const classNames = {
  menuProduct: {
    wrapperActive: 'active',
    imageVisible: 'active',
  },
  // CODE ADDED START
  cart: {
    wrapperActive: 'active',
  },
    // CODE ADDED END
};

const settings = {
  amountWidget: {
    defaultValue: 1,
    defaultMin: 1,
    defaultMax: 9,
  }, // CODE CHANGED
  // CODE ADDED START
  cart: {
    defaultDeliveryFee: 20,
  },
  // CODE ADDED END
};

const templates = {
  menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  // CODE ADDED START
  cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  // CODE ADDED END
};

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
      const allOptionImages = thisProduct.dom.imageWrapper.querySelectorAll('.product__images');
      let visible = classNames.menuProduct.imageVisible;
      
      allOptionImages.forEach(image => {
        image.classList.remove(visible);
      });
      //console.log('allOption Images ');
      //console.log(allOptionImages);

      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionImage = thisProduct.dom.imageWrapper.querySelector(`.${paramId}-${optionId}`);
          //console.log('optionImage ');
          //console.log(optionImage);

          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected) {

            if(!option.default) {
              price += parseFloat(option.price); 
          
              if(optionImage) {
                optionImage.classList.add(visible);
              }
            }
            } else {
            if (option.default) {
              price -= parseFloat(option.price);
              if (optionImage) {
                optionImage.classList.remove(visible);
              }
            }
          } 
        }
      }
      thisProduct.priceSigle = price;
      thisProduct.amount = thisProduct.amountWidget.value;
      price *=thisProduct.amountWidget.value;
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

    preparateCartProduct(){
      const thisProduct = this;
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amount,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,
        params: this.prepareCartProductParams(),
      };
      return productSummary;
    }


    addToCart(){
      const thisProduct = this;
      app.cart.add(thisProduct.preparateCartProduct());
    }
  }
  
  class AmountWidget {
      constructor(element) {
        const thisWidget = this;
        console.log('AmountWidget: ', thisWidget);
        console.log('constructor arguments: ', element);
        
        thisWidget.getElements(element);
        thisWidget.initActions()
      }

      getElements(element) {
        const thisWidget = this;

        thisWidget.element = element;
        thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
        thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
        thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
        thisWidget.setValue(thisWidget.input.value);
      }

      setValue(value) {
        const thisWidget = this;

        const newValue = parseInt(value);
        if (!isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
          thisWidget.value = newValue;
          thisWidget.input.value = thisWidget.value;
          thisWidget.announce();
        } else if (thisWidget.input.hasAttribute('value')){
          thisWidget.value = parseInt(thisWidget.input.getAttribute('value'));
          thisWidget.input.value = thisWidget.value;
          thisWidget.announce();
        }else{
          thisWidget.value = settings.amountWidget.defaultValue;
          thisWidget.input.value = thisWidget.value;
          thisWidget.announce();
        }
        } 
      
      announce(){
          const thisWidget = this;

          const event = new Event('updated');
          thisWidget.element.dispatchEvent(event);
        }

      initActions() {
        const thisWidget = this;
      
        thisWidget.input.addEventListener('change', function () {
          thisWidget.setValue(thisWidget.input.value); 
        });
      
        thisWidget.linkDecrease.addEventListener('click', function (event) {
          event.preventDefault();
          thisWidget.setValue(thisWidget.value - 1); 
        });
      
        thisWidget.linkIncrease.addEventListener('click', function (event) {
          event.preventDefault();
          thisWidget.setValue(thisWidget.value + 1); 
        });
      }
    }  
    
  class Cart {
    constructor(element)  {
      const thisCart = this;

      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      console.log('new Cart', thisCart);
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom ={};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    }

    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
    }

    add (menuProduct) {
      //const thisCart = this;
      console.log('adding product', menuProduct);
    }
  }  

  const app = {
    initMenu: function(){
      const thisApp = this;
      for(let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },  
    
    initData: function(){
    const thisApp = this;
    thisApp.data = dataSource;
    },

    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },

    initCart: function(){
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
  };
  app.init();
}