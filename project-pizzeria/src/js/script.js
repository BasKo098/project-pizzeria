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

  cart: {
    wrapperActive: 'active',
  },
};

const settings = {
  amountWidget: {
    defaultValue: 1,
    defaultMin: 1,
    defaultMax: 9,
  }, 
  cart: {
    defaultDeliveryFee: 20,
  },
  
  db: {
    url: '//localhost:3131',
    products: 'products',
    orders: 'orders',
  },
  
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

      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionImage = thisProduct.dom.imageWrapper.querySelector(`.${paramId}-${optionId}`);

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

    preparateCartProduct(){
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


    addToCart(){
      const thisProduct = this;
      app.cart.add(thisProduct.preparateCartProduct());
    }
  }
  class AmountWidget {
      constructor(element) {
        const thisWidget = this;
        
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
          console.log('AmountWidget updated event triggered');

          const event = new CustomEvent('updated', {
            bubbles: true
          });
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
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }

    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      })

      thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct) 
      });

      thisCart.dom.form.addEventListener('submit', event => {
        event.preventDefault();
        thisCart.sendOrder();
      })
    }

    add(menuProduct) {
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();
    }

    update() {
      
      const thisCart = this;
      console.log('Cart updated event triggered');
      const deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
    
      for (let product of thisCart.products) {
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price;
      }
    
      if (!thisCart.products.length) {
        thisCart.totalPrice = 0;
      }
    
      thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
    
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    
      for (let singleTotalPrice of thisCart.dom.totalPrice) {
        singleTotalPrice.innerHTML = thisCart.totalPrice;
      }
    
      console.log('total Number: ' + thisCart.totalNumber);
      console.log('subtotalPrice : ' + thisCart.subtotalPrice);
      console.log('deliveryFee: ' + deliveryFee);
      console.log('total Price: ' + thisCart.totalPrice);
    }

    remove(productToRemove) {
      const thisCart = this;
    
      if (productToRemove instanceof CartProduct) {
        productToRemove.dom.wrapper.remove();
        const indexToRemove = thisCart.products.indexOf(productToRemove);
        thisCart.products.splice(indexToRemove, 1);
        thisCart.update();
      } 
    }

    sendOrder(){
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;
      
      const payload= {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.dom.totalPrice,
        subtotalPrice: thisCart.dom.subtotalPrice,
        totalNumber: thisCart.dom.totalNumber,
        deliveryFee: thisCart.dom.deliveryFee,
        products: [],
      };

      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      
      fetch(url, options)
        .then(function(response){
          return response.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse)
          alert('The order was send succesfully');
        })
        .catch(error => {
          console.error(error)
          alert('There was a problem with sending order. Please try again.')
        })
    }     
  }
  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElement(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }
  
    getElement(element) {
      const thisCartProduct = this;
      thisCartProduct.dom = {
        wrapper: element,
        amountWidget: element.querySelector(select.cartProduct.amountWidget),
        price: element.querySelector(select.cartProduct.price),
        edit: element.querySelector(select.cartProduct.edit),
        remove: element.querySelector(select.cartProduct.remove),
      };
    }
  
    initAmountWidget() {
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
  
      thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
        const amount = thisCartProduct.amountWidget.value;
        const price = thisCartProduct.priceSingle;
        thisCartProduct.amount = amount;
        thisCartProduct.price = amount * price;
        thisCartProduct.dom.price.innerHTML = price * amount;
      });
    }
  
    remove() {
      const thisCartProduct = this;
    
      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
    
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
  
    initActions() {
      const thisCartProduct = this;
      if (thisCartProduct.dom.edit) {
        thisCartProduct.dom.edit.addEventListener('click', (event) => {
          event.preventDefault();
        });
      }
      if (thisCartProduct.dom.remove) {
        thisCartProduct.dom.remove.addEventListener('click', (event) => {
          event.preventDefault();
          console.log('removed');
          thisCartProduct.remove();
        });
      }
    }

    getData(){
      const thisCartProduct = this;

      const productData = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        priceSingle: thisCartProduct.priceSingle,
        price: thisCartProduct.price,
        params: thisCartProduct.params,
      };
      return productData;
    }
  }
  

  const app = {
    initMenu: function(){
      const thisApp = this;
      for(let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },  
    
    initData: function(){
    const thisApp = this;
    thisApp.data = dataSource;
    },

    initCart: function(){
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;

      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
          .then(function(rawResponse){
            return rawResponse.json();
          })
          .then(function(parsedResponse){
            /* save ParsedResponse as thisApp.data.products */
            thisApp.data.products = parsedResponse;
            /*execute initMenu method */
            thisApp.initMenu();
          })
      thisApp.initCart();
    },
  };

  app.init();
}