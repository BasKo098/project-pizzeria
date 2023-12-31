import { settings, select, classNames, templates } from '../settings.js';
import CartProduct from './CartProduct.js';
import { utils } from '../utils.js';

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
          alert('There was a problem with sending Your order. Please try again.')
        })
    }     
  }
  export default Cart;