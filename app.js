const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "u16eh9fcduns",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "dsnxGPeEbZOZjJ1e_JWgyqBcEtWcYv6KKLhbgswEJcM"
});

//variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");



//cart
let cart = [];
//buttons
let buttonsDOM = [];

//getting the products
class Products {
    async getProducts() { //study async
        try{
            
            let contentful = await client.getEntries({
                content_type: "comfyHouseModel"
            });

            //let result = await fetch('products.json'); //study
            //let data = await result.json(); //study

            let products = contentful.items;
            products = products.map(item => {
                const {title, price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title, price, id, image};
            });
            return products;
        }catch(error){
            console.log(error);
        }
    }
    
}

//display product
class UI {
    displayProducts(products){
        let result = '';
        products.forEach(product =>{
            result += `
            <!-- Single product -->
            <article class="product">
                <div class="img-container">
                    <img 
                    src=${product.image} 
                    alt="product"
                    class="product-img"
                    />
                    <button class="bag-btn" data-id=${product.id}>
                        <i class="fas fa-shopping-cart">
                        </i>add to bag
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
            </article>
            <!-- end of single product -->
            `;
        });
        productsDOM.innerHTML = result;
    }
    getBagButtons(){
        const buttons = [...document.querySelectorAll(".bag-btn")]; //use the spread operator to convert nodelist in array so we can work with them
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id; //study dataset
            let inCart = cart.find(item => item.id === id);    
            if(inCart){
                button.innerText = "In Cart";
                button.disabled = true;
            }   
                button.addEventListener("click", event => {
                    
                    event.target.innerText = "In Cart";
                    event.target.disabled = true;
                    //get product from products
                    let cartItem = {...Storage.getProduct(id), amount : 1};                    
                    //add product to the cart
                    cart = [...cart, cartItem];
                    //save cart in local storage
                    Storage.saveCart(cart);
                    //set cart value
                    this.setCartValues(cart);
                    //display cart item
                    this.addCartItem(cartItem);
                    //show cart item
                    this.showCart(cart);
                    
                }); 
        });
    }

    setCartValues(cart){
        //set name
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount; 
        });        
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;             
    }

    addCartItem(item){
        const div = document.createElement('div');
        div.classList.add("cart-item");
        div.innerHTML = `           
                <img src=${item.image} alt="product">
                <div>
                    <h4>${item.title}</h4>  
                    <h5>$${item.price}</h5>    
                    <span class="remove-item" data-id=${item.id}>remove</span>
                </div>
                <div>
                    <i class="fas fa-chevron-up" data-id=${item.id}></i>
                    <h3 class="item-amount">${item.amount}</h3>
                    <i class="fas fa-chevron-down min" data-id=${item.id}></i>
                </div>
            `;
        cartContent.appendChild(div);    
    }
    showCart(){
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add('showCart');
    }
    setupAPP(){
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener("click", this.showCart);
        closeCartBtn.addEventListener("click", this.hideCart);
        console.log(window.screen.width);
        if(window.screen.width > 768){
            cartDOM.addEventListener("mouseover", ()=>{
                cartOverlay.removeEventListener('click', this.hideCart);
            });
            cartDOM.addEventListener("mouseout", ()=>{
                cartOverlay.addEventListener('click', this.hideCart);
            });
        }        
        this.minimumCheck();
    }
    populateCart(cart){
        cart.forEach(item => this.addCartItem(item));
    }
    hideCart(){
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }
    cartLogic(){
        //clear cart functionalit
        clearCartBtn.addEventListener("click", () => {
            let aceptado = window.confirm("Do you really want to clear your cart?");
            if(aceptado){
                this.clearCart();
            }
        }); 
        cartContent.addEventListener("click", (event) => {
            if(event.target.classList.contains('remove-item')){
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);                
            } else if(event.target.classList.contains('fa-chevron-up')){
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
                this.minimumCheck();
            }else if(event.target.classList.contains('fa-chevron-down')){
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                if(tempItem.amount > 1){
                    tempItem.amount = tempItem.amount - 1;  
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                }
                this.minimumCheck();
            }
        });
    }
    clearCart(){
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));

        while(cartContent.children.length > 0){
            cartContent.removeChild(cartContent.children[0]);
        }

        this.hideCart();
        
    }
    removeItem(id){
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.innerHTML = `
            <i class="fas fa-shopping-cart"></i>add to cart
        `;
        button.disabled = false;
    }
    getSingleButton(id){
        return buttonsDOM.find(button => button.dataset.id === id)
    }
    minimumCheck(){
        if(cartContent.hasChildNodes()){
            const arrow = cartContent.querySelectorAll(".fa-chevron-down"); 
            cart.forEach((item, i) => item.amount === 1 ? arrow[i].classList.add("min") : arrow[i].classList.remove("min"));
        }
    }
}

//local storage
class Storage{
    static saveProducts(products){
        localStorage.setItem("products", JSON.stringify(products)) //study localStorage 
    }
    static getProduct(id){
        let products = JSON.parse(localStorage.getItem('products')); //converting to JSON el array "products" saved in localStorage.
        return products.find(product => product.id === id); 
    }
    static saveCart(cart){
        localStorage.setItem("cart", JSON.stringify(cart)); 
    }
    static getCart(){
        return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : []; 
    }
}
 
document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products(); 

    //set up app
    ui.setupAPP();
    
    products
        .getProducts()
        .then(products => {
            ui.displayProducts(products);
            Storage.saveProducts(products);
        })
        .then(() => {
            ui.getBagButtons();
            ui.cartLogic();
        });
});
