import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;
    
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    //console.log('new Product:', thisProduct);
  }

  renderInMenu(){
    const thisProduct = this;
    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /* create element using utilis.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);

    // thisProduct.dom = {};

    // thisProduct.dom.wrapper = element;
    // thisProduct.dom.accordionTrigger = thisProduct.dom.wrapper.querySelector(select.menuProduct.clickable);
    // thisProduct.dom.form = thisProduct.dom.wrapper.querySelector(select.menuProduct.form);
    // thisProduct.dom.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    // thisProduct.dom.cartButton = thisProduct.dom.wrapper.querySelector(select.menuProduct.cartButton);
    // thisProduct.dom.priceElem = thisProduct.dom.wrapper.querySelector(select.menuProduct.priceElem);
    // thisProduct.dom.imageWrapper = thisProduct.dom.wrapper.querySelector(select.menuProduct.imageWrapper);
    // thisProduct.dom.amountWidgetElem = thisProduct.dom.wrapper.querySelector(select.menuProduct.amountWidget)
  }

  initAccordion(){
    const thisProduct = this;

    /* find the clickable trigger (the element that should react to clicking) */
    // const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable)
    // //console.log(clickableTrigger)
    /* START: add event listener to clickable trigger on event click */
    //console.log(thisProduct.accordionTrigger);
    thisProduct.accordionTrigger.addEventListener('click', function(event) {

      /* prevent default action for event */
      event.preventDefault();
      /* find active product (product that has active class) */
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      //console.log(activeProduct);
      /* if there is active product and it's not thisProduct.element, remove class active from it */
      
      //if(activeProduct!==null && activeProduct!==thisProduct.element) - to też jest poprawne (na ten moment)

      if(activeProduct && activeProduct!==thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        //console.log(activeProduct);
      }
      
      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  } 

  initOrderForm(){
    const thisProduct = this;
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
    
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.addToCart();
      thisProduct.processOrder();
    });
    //console.log('initOrderForm');

  }

  processOrder(){
    const thisProduct = this;
    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData', formData);

    // set price to default price
    let price = thisProduct.data.price;

    // for every category (param)...
    for(let paramID in thisProduct.data.params) {

      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramID];
      //console.log(paramID, param);

      // for every option in this category
      for(let optionID in param.options){

        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionID];
        //console.log(optionID, option);
        const optionSelected = formData[paramID] && formData[paramID].includes(optionID);

        // check if there is param with a name of paramId in formData and if it includes optionId
        if(optionSelected) {
          // check if the option is not default
          if(!option.default){
            // add option price to price variable
            price += option.price;
          }
        } else {
          // check if the option is default
          if(option.default){
            // reduce price variable
            price -= option.price;
          }
        }
        //console.log(paramID);
        //console.log(optionID);
        //console.log(option);
        const optionImage = thisProduct.imageWrapper.querySelector('.' + paramID + '-' + optionID);
        //console.log(optionImage);
        if(optionImage){
          //yes! we've found it!
          if(optionSelected){
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
          else{
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }


      }
    }
    /* multiply price by amount */
    thisProduct.priceSingle = price;
    //console.log(price);
    price *= thisProduct.amountWidget.value;
    // update calculated price in the HTML
    
    thisProduct.priceElem.innerHTML = price;
    //console.log('processOrder');
    //console.log(price);
  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;

    const params = {};
    const formData = utils.serializeFormToObject(thisProduct.form);

    // for every category (param)...
    for(let paramID in thisProduct.data.params) {

      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramID];
      //console.log(paramID, param);

      // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
      params[paramID] = {
        label: param.label,
        options: {}
      };
      // for every option in this category
      for(let optionID in param.options){

        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionID];
        const optionSelected = formData[paramID] && formData[paramID].includes(optionID);

        if(optionSelected) {
          //option is seledted!
          params[paramID].options[optionID] = option.label;
        }
      }
    }
    return params;
  }

}

export default Product;