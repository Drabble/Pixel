/**
 * Copyright (c) 2019
 *
 * Pure javascript pixel editor library
 *
 * @summary Pixel editor library
 * @author Antoine Drabble
 *
 * Created at : 2019-08-17
 */

function PixelEditorCanvas(target, width, height, updateColorCallback) {
	// Colors and pixel
	var pixelSize;
	var mouse = {x: 0, y: 0};
	var lastMousePos;

	// Scroll bars
	var scrollBarWidth = 100;
	var scrollBarHeight = 10;

	// Offset
	var offset = { x: 0, y: 0 };
	var drawPos = new Array(width);
	for (var i = 0; i < width; i++) {
		drawPos[i] = new Array(height).fill([255, 255, 255, 0]);
	}

	// Interval between calls
	var horizontalScrollInterval;
	var verticalScrollInterval;
	var moveInterval;
	var drawInterval;

	// Undo and redo
	var undos = [];
	var redos = [];
	var lastDrawnPixel = null;

	// Init the main canvas, the drawing canvas and the grid canvas
	var canvas = document.createElement('canvas');
	canvas.width = target.getBoundingClientRect().width;
	canvas.height = target.getBoundingClientRect().height;
	var ctx = canvas.getContext('2d');

	var drawCanvas = document.createElement('canvas');
	drawCanvas.width = width;
	drawCanvas.height = height;
	var drawCanvasCtx = drawCanvas.getContext('2d');

	var gridCanvas = document.createElement('canvas');
	var gridCanvasCtx = gridCanvas.getContext('2d');
	var showGrid = true;

	var transparencyCanvas = document.createElement('canvas');
	var transparencyCanvasCtx = transparencyCanvas.getContext('2d');
	var showTransparencyBackground = true;

	// The main canvas always keeps the same size as its parent div 
	window.addEventListener("resize", function () {
		canvas.width = target.getBoundingClientRect().width;
		canvas.height = target.getBoundingClientRect().height;
		generateTransparencyCanevas();
		generateGridCanevas();
	});

	recenter();

	generateTransparencyCanevas();

	// Render every animation frame the canvas, grid and scrollbars
	function render() {
		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.imageSmoothingEnabled = false;

		ctx.fillStyle = "rgba(255,255,255,1)";
		ctx.fillRect(offset.x, offset.y, width * pixelSize, height * pixelSize);
		if (showTransparencyBackground) {
			ctx.globalCompositeOperation = 'source-in';
			// Now we can scale our image and display the drawing canvas
			ctx.drawImage(transparencyCanvas, 0, 0, canvas.width, canvas.height);
			ctx.globalCompositeOperation = 'source-over';

		}

		// Now we can scale our image and display the drawing canvas
		ctx.drawImage(drawCanvas, offset.x, offset.y, width * pixelSize, height * pixelSize);

		if (showGrid && pixelSize > 4) {
			ctx.globalCompositeOperation = 'source-atop';
			// Now we can scale our image and display the drawing canvas
			ctx.drawImage(gridCanvas, offset.x % pixelSize, offset.y % pixelSize, canvas.width + 2 * pixelSize, canvas.height + 2 * pixelSize);
			ctx.globalCompositeOperation = 'source-over';
		}

		// Draw the scrollbars
		ctx.fillStyle = "rgba(150,150,150,1)";
		var horizontal = horizontalScrollbarPos();
		var vertical = verticalScrollbarPos();
		ctx.fillRect(horizontal[0], horizontal[1], scrollBarWidth, scrollBarHeight); // Horizontal
		ctx.fillRect(vertical[0], vertical[1], scrollBarHeight, scrollBarWidth); // Veritcal

		// Request next animation frame
		window.requestAnimationFrame(render);
	}
	window.requestAnimationFrame(render);

	

	function recenter() {
		// Init the size and offset of the canvas to center it
		pixelSize = canvas.width < canvas.height ? (canvas.width - 50) / width : (canvas.height - 50) / height;
		offset.x = (canvas.width - pixelSize * width) / 2;
		offset.y = (canvas.height - pixelSize * height) / 2;
		generateGridCanevas();
	}


	// Render the transparency canvas
	function generateTransparencyCanevas() {
		// Generate the transparency image background
		var pixelSize = 8;
		transparencyCanvas.width = canvas.width / pixelSize;
		transparencyCanvas.height = canvas.height / pixelSize;
		var backgroundImageData = transparencyCanvasCtx.createImageData(pixelSize, pixelSize);
		for (var y = 0; y < pixelSize; y++) {
			for (var x = 0; x < pixelSize; x++) {
				if ((x + y) % 2 == 1) {
					var index = (x + y * Math.round(pixelSize)) * 4;
					backgroundImageData.data[index] = 200;
					backgroundImageData.data[index + 1] = 200;
					backgroundImageData.data[index + 2] = 200;
					backgroundImageData.data[index + 3] = 255;
				} else {
					var index = (x + y * pixelSize) * 4;
					backgroundImageData.data[index] = 255;
					backgroundImageData.data[index + 1] = 255;
					backgroundImageData.data[index + 2] = 255;
					backgroundImageData.data[index + 3] = 255;
				}
			}
		}

		// Set the transparency image background
		for (var x = 0; x < canvas.width / pixelSize; x++) {
			for (var y = 0; y < canvas.height / pixelSize; y++) {
				transparencyCanvasCtx.putImageData(backgroundImageData, x * pixelSize, y * pixelSize, 0, 0, pixelSize, pixelSize);
			}
		}
	}

	// Render the grid canvas
	function generateGridCanevas() {
		gridCanvasCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

		gridCanvas.width = canvas.width + 2 * pixelSize;
		gridCanvas.height = canvas.height + 2 * pixelSize;

		gridCanvasCtx.beginPath();
		gridCanvasCtx.strokeStyle = 'rgba(10, 10, 10, 0.5)';
		gridCanvasCtx.lineWidth = Math.max(2, 1 / pixelSize);
		for (var x = 0; x <= (canvas.width / pixelSize) + 2; x++) {
			gridCanvasCtx.moveTo(x * pixelSize, 0);
			gridCanvasCtx.lineTo(x * pixelSize, canvas.height + 2 * pixelSize);
		}
		for (var y = 0; y <= (canvas.width / pixelSize) + 2; y++) {
			gridCanvasCtx.moveTo(0, y * pixelSize);
			gridCanvasCtx.lineTo(canvas.width + 2 * pixelSize, y * pixelSize);
		}
		gridCanvasCtx.stroke();
	}

	// Fill a color
	function fill(x, y, oldColor, newColor) {
		// List of pixels to visit
		var toVisit = [[x, y]];

		// Visited pixels
		var visited = new Array(width);
		for (var i = 0; i < width; i++) {
			visited[i] = new Array(height).fill(false);
		}
		visited[x][y] = true;
		// Visit every pixel in bfs style and color them
		while (toVisit.length != 0) {
			var p = toVisit[0];
			if (oldColor[0] == drawPos[p[0]][p[1]][0] && oldColor[1] == drawPos[p[0]][p[1]][1] && oldColor[2] == drawPos[p[0]][p[1]][2] && oldColor[3] == drawPos[p[0]][p[1]][3]) {
				drawPos[p[0]][p[1]] = newColor;
				drawCanvasCtx.clearRect(p[0], p[1], 1, 1);
				drawCanvasCtx.fillStyle = rgbaToRgbaString(drawPos[p[0]][p[1]]);
				drawCanvasCtx.fillRect(p[0], p[1], 1, 1);
				var neighbours = [[p[0] + 1, p[1]], [p[0] - 1, p[1]], [p[0], p[1] + 1], [p[0], p[1] - 1]];
				for (var i = 0; i < 4; i++) {
					if (neighbours[i][0] >= 0 && neighbours[i][0] < width && neighbours[i][1] >= 0 && neighbours[i][1] < height && !visited[neighbours[i][0]][neighbours[i][1]]) {
						toVisit.push(neighbours[i]);
						visited[neighbours[i][0]][neighbours[i][1]] = true;
					}
				}
			}
			toVisit.shift();
		}
	}

	// Compute the horizontal scroll bar pos based on canvas position and size
	function horizontalScrollbarPos() {
		var left = offset.x + width * pixelSize;
		var right = canvas.width - offset.x;
		return [(left / (left + right)) * (canvas.width - 100), canvas.height - 15];
	}

	// Compute the vertical scroll bar pos based on canvas position and size
	function verticalScrollbarPos() {
		var top = offset.y + height * pixelSize;
		var bottom = canvas.height - offset.y;
		return [canvas.width - 15, (top / (top + bottom)) * (canvas.height - 100)];
	}

	this.stopLeftClick = function () {
		lastDrawnPixel = null;
		clearInterval(drawInterval);
		clearInterval(horizontalScrollInterval);
		clearInterval(verticalScrollInterval);
	}

	this.stopRightClick = function () {
		lastDrawnPixel = null;
		clearInterval(moveInterval);
	}

	this.startRightClick = function () {
		lastMousePos = mouse;
		moveInterval = setInterval(function () {
			offset.x += (mouse.x - lastMousePos.x);
			offset.y += (mouse.y - lastMousePos.y);
			offset.x = clamp(offset.x, -width * pixelSize + 10, canvas.width - 10);
			offset.y = clamp(offset.y, -height * pixelSize + 10, canvas.height - 10);
			lastMousePos = mouse;
		});
	}

	this.startLeftClick = function (color, tool) {
		color = hsvaToRgba(color);
		// Handle scrollbars
		var horizontal = horizontalScrollbarPos();
		var vertical = verticalScrollbarPos();
		var rect = canvas.getBoundingClientRect();
		var mousePosX = event.clientX - rect.left;
		var mousePosY = event.clientY - rect.top;
		if (mousePosX >= horizontal[0] && mousePosX <= horizontal[0] + scrollBarWidth && mousePosY >= horizontal[1] && mousePosY < horizontal[1] + scrollBarHeight) {
			// On horizontal scrollbar
			horizontalScrollInterval = setInterval(function () {
				var mousePosX = clamp(mouse.x, 50, canvas.width - 50);
				var percentLeft = (mousePosX - 50) / (canvas.width - 100);
				offset.x = percentLeft * (canvas.width - 20 + width * pixelSize) - width * pixelSize + 10;
			}, 10);
		} else if (mousePosX >= vertical[0] && mousePosX <= vertical[0] + scrollBarHeight && mousePosY >= vertical[1] && mousePosY < vertical[1] + scrollBarWidth) {
			// On vertical scrollbar
			verticalScrollInterval = setInterval(function () {
				var mousePosY = clamp(mouse.y, 50, canvas.height - 50);
				var percentTop = (mousePosY - 50) / (canvas.height - 100);
				offset.y = percentTop * (canvas.height - 20 + height * pixelSize) - height * pixelSize + 10;
			}, 10);
		} else {
			// set interval to capture mouse move
			var draw = function () {
				var pos = { x: Math.round((mouse.x - pixelSize / 2 - offset.x) / pixelSize), y: Math.round((mouse.y - pixelSize / 2 - offset.y) / pixelSize) };

				if (lastDrawnPixel == null || lastDrawnPixel.x != pos.x || lastDrawnPixel.y != pos.y) {
					switch (tool.type) { // TODO should we interpolate here?
						case 1: { // Brush
							redos = [];
							var pixels = [];
							// TOdo: size of brush
							for (var i = -tool.size + 1; i <= tool.size - 1; i++) {
								for (var j = -tool.size + 1; j <= tool.size - 1; j++) {
									if (Math.sqrt(Math.pow(i, 2) + Math.pow(j, 2)) < tool.size) { // Make it a circle
										if (pos.x + i >= 0 && pos.x + i < width && pos.y + j >= 0 && pos.y + j < height) { // Valid pos in matrix
											if (drawPos[pos.x + i][pos.y + j] != color) { // Not same color
												
												drawCanvasCtx.clearRect(pos.x + i, pos.y + j, 1, 1);
												var oldColor = drawPos[pos.x + i][pos.y + j];
												var newColor = color;
												switch (parseInt(tool.blendmode)) {
													case 1: {
														newColor = [ // Alpha multiply
															oldColor[0] * (1 - newColor[3]) + newColor[0] * newColor[3],
															oldColor[1] * (1 - newColor[3]) + newColor[1] * newColor[3],
															oldColor[2] * (1 - newColor[3]) + newColor[2] * newColor[3],
															oldColor[3] * (1 - newColor[3]) + newColor[3]
														];
														break;
													}
													case 2: {
														newColor = color;
														break;
													}
													case 3: {
														newColor = [
															((oldColor[0] * (oldColor[3])) + (newColor[0] * (newColor[3]))) % 256,
															((oldColor[1] * (oldColor[3])) + (newColor[1] * (newColor[3]))) % 256,
															((oldColor[2] * (oldColor[3])) + (newColor[2] * (newColor[3]))) % 256,
															Math.max(oldColor[3], newColor[3])
														];
														break;
													}
												}

												pixels.push({ x: pos.x + i, y: pos.y + j, oldColor: drawPos[pos.x + i][pos.y + j], newColor: newColor });
												drawPos[pos.x + i][pos.y + j] = newColor;
												drawCanvasCtx.fillStyle = rgbaToRgbaString(drawPos[pos.x + i][pos.y + j]);
												drawCanvasCtx.fillRect(pos.x + i, pos.y + j, 1, 1);
											}
										}
									}
								}
							}
							if (pixels.length > 0) {
								undos.push({ type: 'brush', pixels: pixels });
							}
							break;
						}
						case 2: { // Picker
							var hsv = rgbaToHsva(drawPos[pos.x][pos.y]);
							updateColorCallback(hsv);
							break;
						}
						case 3: { // Eraser
							undos.push({ type: 'brush', pixels: [{ x: pos.x, y: pos.y, oldColor: drawPos[pos.x][pos.y], newColor: [0, 0, 0, 0] }] });
							redos = [];
							drawPos[pos.x][pos.y] = "rgba(0,0,0,0)";
							drawCanvasCtx.clearRect(pos.x, pos.y, 1, 1);
							drawCanvasCtx.fillStyle = rgbaToRgbaString(drawPos[pos.x][pos.y]);
							drawCanvasCtx.fillRect(pos.x, pos.y, 1, 1);
							break;
						}
						case 4: { // Fill
							// Done outisde interval
							break;
						}
					}
					lastDrawnPixel = { x: pos.x, y: pos.y };
				}
			};
			draw();
			drawInterval = setInterval(draw, 1);

			// handle left click
			if (tool.type == 4) { // Fill
				var pos = { x: Math.round((mouse.x - pixelSize / 2 - offset.x) / pixelSize), y: Math.round((mouse.y - pixelSize / 2 - offset.y) / pixelSize) };

				if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height && drawPos[pos.x][pos.y] != color) {
					var oldColor = drawPos[pos.x][pos.y];
					var newColor = color;

					undos.push({ type: 'fill', x: pos.x, y: pos.y, oldColor: oldColor, newColor: newColor });

					fill(pos.x, pos.y, oldColor, newColor);
				}
			}
		}
	}

	this.moveX = function (amount) {
		offset.x = clamp(offset.x + amount, -width * pixelSize + 10, canvas.width - 10);
		// Regenerate grid because canvas moved
		generateGridCanevas();
	}

	this.moveY = function (amount) {
		offset.y = clamp(offset.y + amount, -height * pixelSize + 10, canvas.height - 10);

		// Regenerate grid because canvas moved
		generateGridCanevas();
	}

	this.setMouse = function(newMouse) {
		mouse = newMouse;
	}

	this.zoom = function (amount) {
		var rect = canvas.getBoundingClientRect();
		factor = pixelSize;
		pixelSize -= amount * pixelSize / 500;
		pixelSize = clamp(pixelSize, 0.05, 1000);
		factor = pixelSize / factor;
		posX = clamp(event.clientX - rect.left - offset.x, 0, width * pixelSize / factor);
		posY = clamp(event.clientY - rect.top - offset.y, 0, height * pixelSize / factor);
		offset.x -= posX * factor - posX;
		offset.y -= posY * factor - posY;
		offset.x = clamp(offset.x, -width * pixelSize + 10, canvas.width - 10);
		offset.y = clamp(offset.y, -height * pixelSize + 10, canvas.height - 10);

		// Regenerate grid because canvas moved
		generateGridCanevas();
	}

	this.undo = function () {
		if (undos.length > 0) {
			var undo = undos.pop();
			redos.push(undo);
			if (undo.type == 'fill') {
				fill(undo.x, undo.y, undo.newColor, undo.oldColor);
			} else if (undo.type == 'brush') {
				for (var i = 0; i < undo.pixels.length; i++) {
					drawPos[undo.pixels[i].x][undo.pixels[i].y] = undo.pixels[i].oldColor;
					drawCanvasCtx.clearRect(undo.pixels[i].x, undo.pixels[i].y, 1, 1);
					drawCanvasCtx.fillStyle = rgbaToRgbaString(undo.pixels[i].oldColor);
					drawCanvasCtx.fillRect(undo.pixels[i].x, undo.pixels[i].y, 1, 1);
				}
			}
		}
	}

	// Redo the last cancelled action
	this.redo = function () {
		if (redos.length > 0) {
			var redo = redos.pop();
			undos.push(redo);
			if (redo.type == 'fill') {
				fill(redo.x, redo.y, redo.oldColor, redo.newColor);
			} else if (redo.type == 'brush') {
				for (var i = 0; i < redo.pixels.length; i++) {
					drawPos[redo.pixels[i].x][redo.pixels[i].y] = redo.pixels[i].newColor;
					drawCanvasCtx.clearRect(redo.pixels[i].x, redo.pixels[i].y, 1, 1);
					drawCanvasCtx.fillStyle = rgbaToRgbaString(redo.pixels[i].newColor);
					drawCanvasCtx.fillRect(redo.pixels[i].x, redo.pixels[i].y, 1, 1);
				}
			}
		}
	};
	

	this.recenter = function () {
		recenter();
	}


	this.toggleGrid = function () {
		showGrid = !showGrid;
	}

	this.toggleTransparencyBackground = function () {
		showTransparencyBackground = !showTransparencyBackground;
	}
	this.show = function() {
		target.appendChild(canvas);
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
	function clamp(val, min, max) {
		return Math.min(Math.max(val, min), max);
	};

	/* Convert hsv value to rgba
		*
		* @param {array<number>} hsv - An array of length >= 2 containing the hsv data [h,s,v]
		*                       0 <= h <= 360 : the angle from the center of the wheel
		*						 0 <= s <= 100 : the radius from the center of the wheel
		*						 0 <= v <= 100 : the brightness of the color
		*
		* @returns {string} rgba - for example "rgba(255,255,255,1)"
		*/
	function hsvaToRgba(hsva) {
		var rgb = hsvToRgb(hsva);
		return [rgb[0], rgb[1], rgb[2], hsva[3]];
	}

	/* Convert rgba value to hsva
		*
		* @param {string} rgba - for example "rgba(255,255,255,1)"
		*
		* @returns {array} [hsv,opacity] - hsv is an array of length == 3 containing the hsv data [h,s,v]
		*                       0 <= h <= 360 : the angle from the center of the wheel
		*						 0 <= s <= 100 : the radius from the center of the wheel
		*						 0 <= v <= 100 : the brightness of the color
		*/
	function rgbaToHsva(rgba) {
		var r = rgba[0], g = rgba[1], b = rgba[2];
		let v = Math.max(r, g, b), n = v - Math.min(r, g, b);
		let h = n && ((v == r) ? (g - b) / n : ((v == g) ? 2 + (b - r) / n : 4 + (r - g) / n));
		return [Math.round(60 * (h < 0 ? h + 6 : h)), Math.round(v && n / v * 100), Math.round(v / 2.55), rgba[3]];
	}

	/* Convert rgba value to rgba string
		*
		* @param {string} rgba - for example "rgba(255,255,255,1)"
		*
		* @returns {array} [hsv,opacity] - hsv is an array of length == 3 containing the hsv data [h,s,v]
		*                       0 <= h <= 360 : the angle from the center of the wheel
		*						 0 <= s <= 100 : the radius from the center of the wheel
		*						 0 <= v <= 100 : the brightness of the color
		*/
	function rgbaToRgbaString(rgba) {
		return "rgba(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + "," + rgba[3] + ")";
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
}