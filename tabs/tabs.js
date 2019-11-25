/**
 * Pure javascript pixel editor library
 *
 * @summary Pixel editor library
 * @author Antoine Drabble
 * 
 * Copyright (c) 2019 Antoine Drabble
 *
 * Created at : 2019-08-17
 */

var Tabs = function (target, selectCanvasCallback, removeCanvasCallback) {
    var target = document.getElementById(target).querySelector("ul");
    var tabs = [];
    var currentTab = -1;

    this.newTab = function(name) {
        // Create the tab element
        var tab = document.createElement("li");
        var tabName = document.createElement("div");
        tabName.classList.add("name");
        var close = document.createElement('i');
        close.classList.add("fa");
        close.classList.add("fa-times");
        close.classList.add("close");
        tab.appendChild(tabName);
        tab.appendChild(close);
        target.appendChild(tab);
        tabs.push(tab);
        tab.querySelector(".name").textContent = name;
        this.selectTab(tabs.length - 1);
        tab.addEventListener('click', function(e){
            for(var i = 0; i < tabs.length; i++){
                if(tab === tabs[i]){
                    this.selectTab(i);
                    break;
                }
            }
        }.bind(this));
        close.addEventListener('click', function(e){
            for(var i = 0; i < tabs.length; i++){
                if(tab === tabs[i]){
                    this.removeTab(i);
                    e.preventDefault();
                    break;
                }
            }
        }.bind(this));
    }

    this.removeTab = function(i) {
        if(currentTab == i){
            if(i < tabs.length - 1){
                this.selectTab(i + 1);
            } else if(i > 0){
                this.selectTab(i - 1);
            }
        } else if(currentTab > i){
            currentTab--;
        }
        removeCanvasCallback(i);
        tabs[i].remove();
        tabs.splice(i,1);
    }.bind(this);

    this.selectTab = function(i) {
        currentTab = i;
        selectCanvasCallback(i);
        target.querySelectorAll("li").forEach(function(e){
            e.classList.remove("active");
        });
        tabs[i].classList.add("active");
    }

    this.nextTab = function() {
        if(currentTab + 1 < tabs.length){
            currentTab++;
            this.selectTab(currentTab);
        }
    }

    this.previousTab = function() {
        if(currentTab - 1 >= 0){
            currentTab--;
            this.selectTab(currentTab);
        }
    }
}