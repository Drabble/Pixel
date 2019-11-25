/**
 * Color picker library that uses Javascript and Jquery
 *
 * @summary Color picker library
 * @author Antoine Drabble
 * 
 * Copyright (c) 2019 Antoine Drabble
 * 
 * Created at : 2019-08-17
 */

function ColorPicker(target, width, height, callback) {
	
	// Create canvas and context objects
	var canvas = document.getElementById(target);
	var ctx = canvas.getContext('2d');
	var currentColor = [0,0,100,1];
	
	// Drawing the color wheel
	var imageData = ctx.createImageData(width,height);
	for(var y = 0; y < canvas.width; y++){
		for(var x = 0; x < canvas.height; x++){
			//if(Math.sqrt(Math.pow(x-width/2,2) + Math.pow(y-width/2,2)) < width/2){
			var hsv = coordinatesToHsv([x,y], canvas.width, canvas.height);
			var rgb = hsvToRgb(hsv);
			var index = (x + y * canvas.width) * 4;
			imageData.data[index] = rgb[0];
			imageData.data[index+1] = rgb[1];
			imageData.data[index+2] = rgb[2];
			imageData.data[index+3] = 255;
			//}
		}   
	}
	
	// Create an offscreen canvas to display the generated wheel image in
	// so that we can use filters (brightness and opacity)
	// because filters don't work on putImageData
	const offscreen = document.createElement('canvas');
	offscreen.width = width;
	offscreen.height = height;
	offscreen.getContext('2d')
	  .putImageData(imageData, 0, 0);
	
	// Set the initial cursor position to the center
	var cursorPositionX = canvas.width/2;
	var cursorPositionY = canvas.height/2;
	
	// Handle brightness range slider
	var brightnessSliders = document.getElementsByClassName('brightness-slider');
	for(var i = 0; i < brightnessSliders.length; i++){
		brightnessSliders[i].addEventListener('input', function() {
			currentColor[2] = this.value;
		});
	}
	updateBrightness();
	  
	
	// Opacity range slider
	var opacitySliders = document.getElementsByClassName('opacity-slider');
	for(var i = 0; i < opacitySliders.length; i++){
		opacitySliders[i].addEventListener('input', function() {
			currentColor[3] = this.value / 255.0;
		});
	}
	ctx.globalAlpha = currentColor[3];
	
	// Handle alpha value change
	document.getElementById('alphaVal').addEventListener('input', function() { 
		var alpha = parseFloat(this.value);
		if(alpha >= 0 && alpha <= 1 && !isNaN(alpha)){
			currentColor[3] = alpha;
			ctx.globalAlpha = currentColor[3];
			var opacitySliders = document.getElementsByClassName('opacity-slider');
			for(var i = 0; i < opacitySliders.length; i++){
				opacitySliders[i].value = currentColor[3] * 255;
			}
		}
	});
	
	// Handle hsv input value change
	document.getElementById('hsvVal').addEventListener('input', function() {
		var temp = this.value.split(",");
		var hsv = [parseInt(temp[0]), parseInt(temp[1]), parseInt(temp[2])];
		if(temp.length == 3 && !isNaN(hsv[0])&& !isNaN(hsv[1]) && !isNaN(hsv[2]) && hsv[0] >= 0 && hsv[0] <= 360 && hsv[1] >= 0 && hsv[1] <= 100 && hsv[2] >= 0 && hsv[2] <= 100 ){
			var opacity = currentColor[3];
			currentColor = hsv;
			currentColor.push(opacity);
			updateBrightness();
		}
	});
	
	// Handle rgb input value change
	document.getElementById('rgbVal').addEventListener('input',	function() {
		var temp = this.value.split(",");
		var rgb = [parseInt(temp[0]), parseInt(temp[1]), parseInt(temp[2])];
		if(temp.length == 3 && !isNaN(rgb[0])&& !isNaN(rgb[1]) && !isNaN(rgb[2]) && rgb[0] >= 0 && rgb[0] <= 255 && rgb[1] >= 0 && rgb[1] <= 255 && rgb[2] >= 0 && rgb[2] <= 255 ){
			var opacity = currentColor[3];
			currentColor = rgbToHsv(rgb);
			currentColor.push(opacity);
			updateBrightness();
		}
	});
	
	// Handle cmyk input value change
	document.getElementById('cmykVal').addEventListener('input', function() {
		var temp = this.value.split(",");
		var cmyk = [parseInt(temp[0]), parseInt(temp[1]), parseInt(temp[2]), parseInt(temp[3])];
		if(temp.length == 4 && !isNaN(cmyk[0])&& !isNaN(cmyk[1]) && !isNaN(cmyk[2]) && !isNaN(cmyk[3]) && cmyk[0] >= 0 && cmyk[0] <= 100 && cmyk[1] >= 0 && cmyk[1] <= 100 && cmyk[2] >= 0 && cmyk[2] <= 100 && cmyk[3] >= 0 && cmyk[3] <= 100 ){
			var opacity = currentColor[3];
			currentColor = cmykToHsv(cmyk);
			currentColor.push(opacity);
			updateBrightness();
		}
	});
	
	// Handle hex input value change
	document.getElementById('hexVal').addEventListener('input',	function() {
		var hex = this.value.replace("#", '');
		if(hex.length >= 6){
			var opacity = currentColor[3];
			currentColor = hexToHsv(hex);
			currentColor.push(opacity);
			updateBrightness();
		}
	});

	// Handle mouse move on color wheel
	var mouseDown = false;
	canvas.addEventListener('mousedown', function(e) { // mouse down handler
		mouseDown = true;
		updateColorFromWheel(e);		
	})
	canvas.addEventListener('mousemove', function(e) { // mouse move handler
		if (mouseDown) {
			updateColorFromWheel(e);				
		}
	});
	document.addEventListener('mouseup', function() { // mouse up in global
		mouseDown = false;
	});
		
	// Update brightness of canvas
	function updateBrightness(){
		var brightnessSliders = document.getElementsByClassName('brightness-slider');
		for(var i = 0; i < brightnessSliders.length; i++){
			brightnessSliders[i].value = currentColor[2];
		}
		ctx.filter = "brightness(" + currentColor[2] + "%)";
	}
	
	// Update selected color with the cursor position on the wheel
	function updateColorFromWheel(e){
		// Get coordinates of current position
		var canvasOffset = canvas.getBoundingClientRect();
		cursorPositionX = Math.round(e.pageX - canvasOffset.left);
		cursorPositionY = Math.round(e.pageY - canvasOffset.top);
		
		// Select color but keep the same brightness
		var temp_v = currentColor[2];
		var temp_o = currentColor[3];
		currentColor = rgbToHsv([imageData.data[(cursorPositionX + cursorPositionY * canvas.width) * 4], imageData.data[(cursorPositionX + cursorPositionY * canvas.width) * 4 + 1], imageData.data[(cursorPositionX + cursorPositionY * canvas.width) * 4 + 2]]);
		currentColor.push(temp_o);
		currentColor[2] = temp_v;
	}
	
	// Update the color wheel values and redraw on every animation frame
	function render(){

		// Color updated
		callback(currentColor);

		// Draw wheel on main canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(offscreen, 0, 0);

		// Update preview color
		var rgb = hsvToRgb(currentColor);
		var rgbCss = "rgb("+currentColor[0]+", "+currentColor[1]+", "+currentColor[2]+")";
		var previews = document.getElementsByClassName('preview');
		for(var i = 0; i < previews.length; i++){
			previews[i].style.backgroundColor = rgbCss;
		}
		
		// Update controls
		if(document.activeElement !== document.getElementById("rgbVal")){
			document.getElementById("rgbVal").value = rgb[0]+','+rgb[1]+','+rgb[2];
		}
		
		if(document.activeElement !== document.getElementById("hsvVal")){
			document.getElementById("hsvVal").value = currentColor[0]+","+currentColor[1]+","+ currentColor[2];
		}
		
		var cmyk = hsvToCmyk(currentColor);
		if(document.activeElement !== document.getElementById("cmykVal")){
			document.getElementById("cmykVal").value = cmyk[0]+","+cmyk[1]+","+cmyk[2]+","+cmyk[3];
		}
		
		if(document.activeElement !== document.getElementById("hexVal")){
			document.getElementById("hexVal").value = hsvToHex(currentColor);
		}
		
		if(document.activeElement !== document.getElementById("alphaVal")){
			document.getElementById("alphaVal").value = currentColor[3].toFixed(2);
		}
		
		document.getElementById('picked-color').style.backgroundColor = hsvToHex(currentColor);
		document.getElementById('picked-color').style.opacity = currentColor[3];
		
		// Draw the marker
		ctx.globalAlpha = 1 // Temporarily disable alpha
		ctx.filter = "brightness(" + 100 + "%)"; // Temporarily disable brightness
		ctx.beginPath();
		ctx.strokeStyle = '#1e1e1e';
		ctx.fillStyle = '#ffffff';
		var coords = hsvToCoordinates(currentColor, canvas.width, canvas.height);
		ctx.arc(coords[0], coords[1], 7, 0, 2 * Math.PI); // Draw the arc
		ctx.fill();
		ctx.stroke();
		ctx.filter = "brightness(" + currentColor[2] + "%)";
		ctx.globalAlpha = currentColor[3]
		window.requestAnimationFrame(render);
	}
	window.requestAnimationFrame(render);
	
	// ----------------------------------- Public functions --------------------------------------------
	
	this.setColor = function(newColor) {
		currentColor = newColor;
		console.log(newColor);
		var opacitySliders = document.getElementsByClassName('opacity-slider');
		console.log(opacitySliders);
		for(var i = 0; i < opacitySliders.length; i++){
			console.log(newColor);
			opacitySliders[i].value = currentColor[3] * 255;
			console.log(currentColor[3] * 255);
		}
		var brightnessSliders = document.getElementsByClassName('brightness-slider');
		for(var i = 0; i < brightnessSliders.length; i++){
			brightnessSliders[i].value = currentColor[2];
		}
		updateBrightness();
	};
	
	this.increaseOpacity = function(val) {
		currentColor[3] = clamp(currentColor[3] + val, 0, 1);
		ctx.globalAlpha = currentColor[3]
		var opacitySliders = document.getElementsByClassName('opacity-slider');
		for(var i = 0; i < opacitySliders.length; i++){
			opacitySliders[i].value = currentColor[3] * 255;
		}
	}
	
	this.decreaseOpacity = function(val) {
		currentColor[3] = clamp(currentColor[3] - val, 0, 1);
		ctx.globalAlpha = currentColor[3];
		var opacitySliders = document.getElementsByClassName('opacity-slider');
		for(var i = 0; i < opacitySliders.length; i++){
			opacitySliders[i].value = currentColor[3] * 255;
		}
	}
	
	this.increaseBrightness = function(val) {
		currentColor[2] = clamp(currentColor[2] + val, 0, 100);
		updateBrightness();
	}
	
	this.decreaseBrightness = function(val) {
		currentColor[2] = clamp(currentColor[2] - val, 0, 100);
		updateBrightness();
	}
	
	// ---------------------------------------------- Utils --------------------------------------- 
	
	/* Clamp the value between min and max
	 *
	 * @param {number} val - value
	 * @param {number} min - minimum value
	 * @param {number} max - maximum value
	 *
	 * @returns {number} clamped value
	 */
	function clamp (val, min, max) {
		return Math.min(Math.max(val, min), max);
	};
	
	/* Convert radians to degrees
	 *
	 * @param {number} rad - radians
	 *
	 * @returns {number} degrees - degrees converted from radians
	 */
	function radToDeg(rad) {
	  return (360 + 180 * rad / Math.PI) % 360;
	}

	/* Convert rgb value to hsv
	 *
	 * @param {array<number>} rgb - [r,g,b] in the given array 
	 *							       0 <= r <= 255 : red 
	 *								   0 <= g <= 255 : green
	 *								   0 <= b <= 255 : blue
	 *
	 * @returns {array<number>} hsv - An array of length >= 2 containing the hsv data [h,s,v]
	 *                       0 <= h <= 360 : the angle from the center of the wheel
	 *						 0 <= s <= 100 : the radius from the center of the wheel
	 *						 0 <= v <= 100 : the brightness of the color
	 */
	function rgbToHsv(rgb) {
	  var r = rgb[0], g = rgb[1], b = rgb[2];
	  let v=Math.max(r,g,b), n=v-Math.min(r,g,b);
	  let h= n && ((v==r) ? (g-b)/n : ((v==g) ? 2+(b-r)/n : 4+(r-g)/n)); 
	  return [Math.round(60*(h<0?h+6:h)), Math.round(v&&n/v * 100), Math.round(v/2.55)];
	} 

	/* Convert hsv value to rgb
	 *
	 * @param {array<number>} hsv - An array of length >= 2 containing the hsv data [h,s,v]
	 *                       0 <= h <= 360 : the angle from the center of the wheel
	 *						 0 <= s <= 100 : the radius from the center of the wheel
	 *						 0 <= v <= 100 : the brightness of the color
	 *
	 * @returns {array<number>} rgb - [r,g,b] in the given array 
	 *							       0 <= r <= 255 : red 
	 *								   0 <= g <= 255 : green
	 *								   0 <= b <= 255 : blue
	 */
	function hsvToRgb(hsv) {
		var r, g, b, i, f, p, q, t, h, s, v;
		h = hsv[0] / 360.0;
		s = hsv[1] / 100.0;
		v = hsv[2] / 100.0;
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch (i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}
		return [
			Math.floor(r * 255),
			Math.floor(g * 255),
			Math.floor(b * 255)
		];
	}

	/* Convert hsv value to coordinates on the hsv color wheel
	 *
	 * @param {array<number>} hsv - An array of length >= 2 containing the hsv data [h,s,v]
	 *                       0 <= h <= 360 : the angle from the center of the wheel
	 *						 0 <= s <= 100 : the radius from the center of the wheel
	 *						 0 <= v <= 100 : the brightness of the color
	 * @param {number} width - Width of the array for the 2 dimensional coordinates
	 * @param {number} height - Height of the array for the 2 dimensional coordinates
	 *
	 * @returns {array<number>} coordinates - [x,y] in the given array 
	 *							       0 <= x <= width : x coordinate
	 *								   0 <= y <= height : y coordinate
	 */
	function hsvToCoordinates(hsv, width, height){
		var radius = width / 2; // radius of the wheel
		var colorRadius = hsv[1] / 100.0 * radius; // radius from the center of the wheel
		var angle = (360 - hsv[0]) / 360.0 * (2 * Math.PI); // angle from the center of the wheel
		var midX = width / 2; // midpoint of the wheel
		var midY = height / 2;
		var xOffset = Math.cos(angle) * colorRadius; //offset from the midpoint of the wheel
		var yOffset = Math.sin(angle) * colorRadius;
		return [Math.floor(midX + xOffset), Math.floor(midY + yOffset)];
	}

	/* Convert coordinates on the hsv color wheel to an hsv value
	 *
	 * @param {array<number>} coords - An array of length >= 2 containing the x and y coordinates [x,y]
	 *							0 <= x <= width : x coordinate
	 *							0 <= y <= height : y coordinate
	 * @param {number} width - Width of the array for the 2 dimensional coordinates
	 * @param {number} height - Height of the array for the 2 dimensional coordinates
	 *
	 * @returns {array<number>} hsv - values [h,s,v] in an array 
	 *                         0 <= h <= 360 : the angle from the center of the wheel
	 *						   0 <= s <= 100 : the radius from the center of the wheel
	 *						   0 <= v <= 100 : the brightness of the color
	 */
	function coordinatesToHsv(coords, width, height){
		var radius = width / 2; // radius of the wheel
		var midX = width / 2; // midpoint of the wheel
		var midY = height / 2;
		var h = 360 - radToDeg(Math.atan2(coords[1] - midY, coords[0] - midX)); // angle from the center of the wheel
		var s = Math.floor(Math.sqrt(Math.pow(coords[1]-midY,2) + Math.pow(coords[0]-midX,2))) / radius * 100; // radius from the center of the wheel
		return [h,s,100];
	}

	/* Convert cmyk value to rgb
	 *
	 * @param {array<number>} cmyk - An array of length >= 4 containing the hsv data [c,m,y,k]
	 *                       		 0 <= c <= 100 : cyan
	 *								 0 <= m <= 100 : magenta
	 *								 0 <= y <= 100 : yellow
	 *								 0 <= k <= 100 : black
	 *
	 * @returns {array<number>} rgb - [r,g,b] in the given array 
	 *							       0 <= r <= 255 : red 
	 *								   0 <= g <= 255 : green
	 *								   0 <= b <= 255 : blue
	 */
	function cmykToRgb (cmyk){
		c = cmyk[0] / 100;
		m = cmyk[1] / 100;
		y = cmyk[2] / 100;
		k = cmyk[3] / 100;

		return [
			Math.round((1 - Math.min( 1, c * ( 1 - k ) + k )) * 255 ),
			Math.round((1 - Math.min( 1, m * ( 1 - k ) + k )) * 255 ),
			Math.round((1 - Math.min( 1, y * ( 1 - k ) + k )) * 255 )
		];
	}

	/* Convert rgb value to cmyk
	 *
	 * @param {array<number>} rgb - [r,g,b] in the given array 
	 *							       0 <= r <= 255 : red 
	 *								   0 <= g <= 255 : green
	 *								   0 <= b <= 255 : blue
	 *
	 * @returns {array<number>} cmyk - An array of length 4 containing the hsv data [c,m,y,k]
	 *                       		   0 <= c <= 100 : cyan
	 *						 		   0 <= m <= 100 : magenta
	 *						 		   0 <= y <= 100 : yellow
	 *						 		   0 <= k <= 100 : black
	 */
	function rgbToCmyk (rgb){
		r = rgb[0] / 255;
		g = rgb[1] / 255;
		b = rgb[2] / 255;
		
		var k = Math.min( 1 - r, 1 - g, 1 - b );

		return [
			k == 1 ? 0 : Math.round( ( 1 - r - k ) / ( 1 - k ) * 100 ),
			k == 1 ? 0 : Math.round( ( 1 - g - k ) / ( 1 - k ) * 100 ),
			k == 1 ? 0 : Math.round( ( 1 - b - k ) / ( 1 - k ) * 100 ),
			Math.round( k * 100 )
		];
	}

	/* Convert hex value to rgb
	 *
	 * @param {string} hex - A string starting with '#' or '' followed by 6 hexadecimal values : example "#1c1c1c"
	 *
	 * @returns {array<number>} rgb - [r,g,b] in the given array 
	 *							       0 <= r <= 255 : red 
	 *								   0 <= g <= 255 : green
	 *								   0 <= b <= 255 : blue
	 */
	function hexToRgb(hex){
		hex = hex.replace('#','');
		r = parseInt(hex.substring(0,2), 16);
		g = parseInt(hex.substring(2,4), 16);
		b = parseInt(hex.substring(4,6), 16);
		return [r,g,b];
	}

	/* Convert rgb value to hex
	 *
	 * @param {array<number>} rgb - [r,g,b] in the given array 
	 *							       0 <= r <= 255 : red 
	 *								   0 <= g <= 255 : green
	 *								   0 <= b <= 255 : blue
	 *
	 * @returns {string} hex - A string starting with '#' or '' followed by 6 hexadecimal values : example "#1c1c1c"
	 */
	function rgbToHex(rgb) {
		var r = rgb[0].toString(16);
		var g = rgb[1].toString(16);
		var b = rgb[2].toString(16);
		return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
	}

	/* Convert rgb value to hex
	 *
	 * @param {array<number>} rgb - [r,g,b] in the given array 
	 *							       0 <= r <= 255 : red 
	 *								   0 <= g <= 255 : green
	 *								   0 <= b <= 255 : blue
	 *
	 * @returns {string} hex - A string starting with '#' or '' followed by 8 hexadecimal values : example "#1C1C1CFF"
	 */
	function rgbToHexAlpha(rgb, alpha) {
		var r = rgb[0].toString(16);
		var g = rgb[1].toString(16);
		var b = rgb[2].toString(16);
		var a = Math.round(alpha * 255).toString(16);
		return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b) + (a.length == 1 ? "0" + a : a);
	}

	/* Convert hsv value to cmyk
	 *
	 * @param {string} hsv - values [h,s,v] in an array 
	 *                         0 <= h <= 360 : the angle from the center of the wheel
	 *						   0 <= s <= 100 : the radius from the center of the wheel
	 *						   0 <= v <= 100 : the brightness of the color
	 *
	 * @returns {array<number>} cmyk - An array of length 4 containing the hsv data [c,m,y,k]
	 *                       		   0 <= c <= 100 : cyan
	 *						 		   0 <= m <= 100 : magenta
	 *						 		   0 <= y <= 100 : yellow
	 *						 		   0 <= k <= 100 : black
	 */
	function hsvToCmyk(hsv){
		return rgbToCmyk(hsvToRgb(hsv));
	}

	/* Convert cmyk value to hsv
	 *
	 * @param {array<number>} cmyk - An array of length 4 containing the hsv data [c,m,y,k]
	 *                       		   0 <= c <= 100 : cyan
	 *						 		   0 <= m <= 100 : magenta
	 *						 		   0 <= y <= 100 : yellow
	 *						 		   0 <= k <= 100 : black
	 *
	 * @returns {string} hsv - values [h,s,v] in an array 
	 *                         0 <= h <= 360 : the angle from the center of the wheel
	 *						   0 <= s <= 100 : the radius from the center of the wheel
	 *						   0 <= v <= 100 : the brightness of the color
	 */
	function cmykToHsv(cmyk){
		return rgbToHsv(cmykToRgb(cmyk));
	}

	/* Convert hsv value to hex
	 *
	 * @param {array<number>} hsv - values [h,s,v] in an array 
	 *                         0 <= h <= 360 : the angle from the center of the wheel
	 *						   0 <= s <= 100 : the radius from the center of the wheel
	 *						   0 <= v <= 100 : the brightness of the color
	 *
	 * @returns {string} hex - A string starting with '#' or '' followed by 6 hexadecimal values : example "#1c1c1c"
	 */
	function hsvToHex(hsv){
		return rgbToHex(hsvToRgb(hsv));
	}

	/* Convert hsv value to hex
	 *
	 * @param {array<number>} hsv - values [h,s,v] in an array 
	 *                         0 <= h <= 360 : the angle from the center of the wheel
	 *						   0 <= s <= 100 : the radius from the center of the wheel
	 *						   0 <= v <= 100 : the brightness of the color
	 *
	 * @returns {string} hex - A string starting with '#' or '' followed by 8 hexadecimal values : example "#1c1c1cFF"
	 */
	function hsvToHexAlpha(hsv, alpha){
		return rgbToHexAlpha(hsvToRgb(hsv), alpha);
	}

	/* Convert hex value to hsv
	 *
	 * @param {string} hex - A string starting with '#' or '' followed by 6 hexadecimal values : example "#1c1c1c"
	 *
	 * @returns {array<number>} hsv - values [h,s,v] in an array 
	 *                         0 <= h <= 360 : the angle from the center of the wheel
	 *						   0 <= s <= 100 : the radius from the center of the wheel
	 *						   0 <= v <= 100 : the brightness of the color
	 */
	function hexToHsv(hex){
		return rgbToHsv(hexToRgb(hex));
	}
};

