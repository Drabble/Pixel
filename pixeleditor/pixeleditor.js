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

function PixelEditor(target, updateColorCallback) {

	// Color
	var color = [255,255,255,1];

	// Current tool - default brush
	var tool = {type: PixelEditor.tools.brush, size: 1, blendmode: 1};

	// Pixel canevas target div / span
	target = document.getElementById(target);

	// List of canevas
	var canvas = [];
	currentCanvas = 0;

	// Capture the mouse movement
	document.addEventListener('mousemove', function(event) { 
		if(currentCanvas < canvas.length){
			var rect = target.getBoundingClientRect();
			canvas[currentCanvas].setMouse({
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			});
		}
	});
	
	// Stop updating drawing with mouse movement
	document.addEventListener('mouseup', function(event) { 
		switch(event.button) {
			case 0: { // Left click
				if(currentCanvas < canvas.length){
					canvas[currentCanvas].stopLeftClick();
				}
				break;
			}
			case 2: { // Right click
				if(currentCanvas < canvas.length){
					canvas[currentCanvas].stopRightClick();
				}
				break;
			}
		}
	});
	
	// Disable context menu
	target.addEventListener('contextmenu', function(event) { 
		event.preventDefault(); 
	}); 
	
	// Handle the scroll wheel to zoom or move offset
	target.addEventListener("wheel", function(event) { 
		if(currentCanvas < canvas.length){
			if(event.altKey){ // Move horizontally
				canvas[currentCanvas].moveX(event.deltaY);
			} else if(event.shiftKey){ // Move vertically
				canvas[currentCanvas].moveY(event.deltaY);
			} else{ // Zoom in or out
				canvas[currentCanvas].zoom(event.deltaY);
			}
		}
	});
	
	// Handle mouse down
	target.addEventListener('mousedown', function() {
		if(currentCanvas < canvas.length){
			var rect = target.getBoundingClientRect();
			canvas[currentCanvas].setMouse({
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			});
			switch(event.button){
				case 0: { // Left click
					canvas[currentCanvas].startLeftClick(color, tool);
					break;
				}
				case 2:{ // Right click
					canvas[currentCanvas].startRightClick();
					break;
				}
			}
		}
	});
	
	// ----------------------------------- Public functions --------------------------------------------
	
	// Set the color of the brushes
	this.setColor = function(newColor) {
		color = newColor;
	};
	
	// Set the current tool
	this.setTool = function(newTool) {
		tool = newTool;
	};
	
	// Cancel the last action
	this.undo = function() {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].undo();
		}
	};
	
	// Redo the last cancelled action
	this.redo = function() {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].redo();
		}
	};
	
	this.zoomIn = function(val) {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].zoom(-val);
		}
	}
	
	this.zoomOut = function(val) {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].zoom(val);
		}
	}
	
	this.moveLeft = function(val) {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].moveX(val);
		}
	}
	
	this.moveUp = function(val) {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].moveY(val);
		}
	}
	
	this.moveRight = function(val) {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].moveX(-val);
		}
	}
	
	this.moveDown = function(val) {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].moveY(-val);
		}
	}
	
	this.toggleGrid = function() {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].toggleGrid();
		}
	}
	
	this.toggleTransparencyBackground = function() {
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].toggleTransparencyBackground();
		}
	}
	
	this.recenter = function() {	
		if(currentCanvas < canvas.length){
			canvas[currentCanvas].recenter();
		}
	}
	
	this.setCanvas = function(i) {
		currentCanvas = i;
		target.querySelectorAll("canvas").forEach(function(elem){
			elem.parentNode.removeChild(elem);
		})
		canvas[currentCanvas].stopRightClick();
		canvas[currentCanvas].stopLeftClick();
		canvas[currentCanvas].show();
	}

	this.removeCanvas = function(i) {
		if(i < currentCanvas){
			currentCanvas--;
		}
		canvas.splice(i, 1);
		if(canvas.length == 0){
			target.querySelectorAll("canvas").forEach(function(elem){
				elem.parentNode.removeChild(elem);
			})
		}
	}

	this.createCanvas = function(width, height){
		currentCanvas = canvas.length;
		canvas.push(new PixelEditorCanvas(target, width, height, function(hsv){
			updateColorCallback(hsv);
		}));
	}
};

PixelEditor.tools = {brush:1, picker:2, eraser:3, fill:4};