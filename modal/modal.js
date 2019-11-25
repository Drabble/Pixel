/**
 * Pure javascript pixel editor library
 *
 * @summary Pixel editor library
 * @author Antoine Drabble
 *
 * Includes code from Justin Herrick on codepen https://codepen.io/jah2488/pen/Gimzn under MIT license
 * Copyright (c) 2019 Antoine Drabble
 *
 * Created at : 2019-08-17
 */

function Modal(target, clickCallback) {
    
    target = document.getElementById(target);

    var mask = document.createElement("div");
    mask.classList.add("mask");
    mask.addEventListener("click", function(){
        this.close();
    }.bind(this));
    
    target.querySelector(".close").addEventListener("click", function(){
        this.close();
    }.bind(this));

    target.querySelector(".submit").addEventListener("click", function(){
        clickCallback();
        this.close();
    }.bind(this));

    document.addEventListener("keydown", function(e) {
        if (e.keyCode == 27) { // Escape
            closeModal();
        }
    });
	
	this.open = function() {
        document.querySelector("body").prepend(mask);
        target.style.visibility = "visible";

	}
	
	this.close = function() {
        mask.remove();
        target.style.visibility = "hidden";
	}
};