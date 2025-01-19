// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// Global Variables
let canvas;
let gl;
let a_position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  // Get the storage location of u FragColor
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get the storage location of u_Size");
    return;
  }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals Related UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_segmentSize = 22;
let triangle_angle = 0;

//Set up actions for the HTML UI elements
function addActionsForHtmlUI() {

  // Animation draw button
  document.getElementById('drawButton').onclick = function() { g_shapesList = []; renderAllShapes(); triangle_draw(); };

  // Animation draw button
  document.getElementById('explosionButton').onclick = function() { g_shapesList = [];
  renderAllShapes(); automaticDraw()};

  // Button Events (Shape Type)
  document.getElementById("green").onclick = function () {
    g_selectedColor = [0.0, 1.0, 0.0, 1.0];
  };
  document.getElementById("red").onclick = function () {
    g_selectedColor = [1.0, 0.0, 0.0, 1.0];
  };
  document.getElementById("clearButton").onclick = function () {
    g_shapesList = [];
    renderAllShapes();
  };
  
  document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};

  // Slider Events
  document.getElementById("redSlide").addEventListener("mouseup", function () {
    g_selectedColor[0] = this.value / 100;
  });
  document
    .getElementById("greenSlide")
    .addEventListener("mouseup", function () {
      g_selectedColor[1] = this.value / 100;
    });
  document.getElementById("blueSlide").addEventListener("mouseup", function () {
    g_selectedColor[2] = this.value / 100;
  });

  document.getElementById("sizeSlide").addEventListener("mouseup", function () {
    g_selectedSize = this.value;
  });
  document.getElementById("segmentSlide").addEventListener("mouseup", function () {
    g_segmentSize = this.value;
  });
  document.getElementById("angleSlide").onchange = function () {
    document.getElementById("angleDisplay").innerText = parseFloat(this.value).toFixed(1); // Update the text
    triangle_angle = updateAngleDisplay(this.value);
    console.log(triangle_angle)
  };
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) }};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];

function click(ev) {
  [x, y] = convertCoordinatesEventToGL(ev);
  
  // Create and store the new point
  let point;
  if(g_selectedType == POINT){
    point = new Point();
  }
  else if(g_selectedType == TRIANGLE){
    point = new Triangle(triangle_angle);
  }
  else{
    point = new Circle(g_segmentSize);
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  console.log("Color: " + point.color);
  console.log("Position: " + point.position);
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // Draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();


  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw each shape in the list
  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function automaticDraw(){
  // (0, 0) is the origin, aka middle of the screen
  let x = 0;
  let y = -1;


  point = new Circle(66);
  point.position = [x, y];
  point.color = [0.22,0.23,0.2,1];
  point.size = 200; // max size is 40
  g_shapesList.push(point);

  x = 0;
  y = 0;

  for(y=0; y <= 0.5; y = y + 0.01){
    point = new Point();
    point.color = [0.62, 0.36, 0.14, 1];
    point.size = 10; // max size is 40
    point.position = [x, y];
    g_shapesList.push(point);
  }

  y = 0.49;

  for(y=0.489; 0.255 <= y; y = y - 0.01){
    for(x=0.05; x<=0.5; x = x + 0.01){
      point = new Point();
      point.color = [1, 0, 0, 1];
      point.size = 10; // max size is 40
      point.position = [x, y];
      g_shapesList.push(point);
    }
  }
  
  y = 0.45;

  for(x=0.0456611; x<=0.493; x = x + 0.001){
    point = new Point();
    point.color = [1, 1, 1, 1];
    point.size = 9; // max size is 40
    point.position = [x, y];
    g_shapesList.push(point);
  }
  
  y = 0.37;
  for(x=0.0456611; x<=0.493; x = x + 0.001){
    point = new Point();
    point.color = [1, 1, 1, 1];
    point.size = 9; // max size is 40
    point.position = [x, y];
    g_shapesList.push(point);
  }

  y = 0.29;
  for(x=0.0456611; x<=0.493; x = x + 0.001){
    point = new Point();
    point.color = [1, 1, 1, 1];
    point.size = 9; // max size is 40
    point.position = [x, y];
    g_shapesList.push(point);
  }

  // Making blue part of the flag
  for(y=0.49; 0.4099 <= y; y = y - 0.01){
    for(x = 0.0456611; x<=0.22; x = x + 0.001){
      point = new Point();
      point.color = [0,0.06,0.29,1];
      point.size = 10; // max size is 40
      point.position = [x, y];
      g_shapesList.push(point);
    }
  }

  // Making star part of the flag
  y = 0.49;
  for(x = 0.055; x<=0.22; x = x + 0.05){
    point = new Point();
    point.color = [1, 1, 1, 1];
    point.size = 5; // max size is 40
    point.position = [x, y];
    g_shapesList.push(point);
  }
  
    // Making star part of the flag
    y = 0.45;
    for(x = 0.07; x<=0.22; x = x + 0.05){
      point = new Point();
      point.color = [1, 1, 1, 1];
      point.size = 5; // max size is 40
      point.position = [x, y];
      g_shapesList.push(point);
    }
    // Making star part of the flag
    y = 0.41;
    for(x = 0.055; x<=0.22; x = x + 0.05){
      point = new Point();
      point.color = [1, 1, 1, 1];
      point.size = 5; // max size is 40
      point.position = [x, y];
      g_shapesList.push(point);
    }

    // Making yellow stars in space
    makeYellowStar(-0.9, -0.195);
    makeYellowStar(-0.785,0.33);
    makeYellowStar(-0.55,0.05);
    makeYellowStar(0.8,0.32);
    makeYellowStar(0.22,0.11);
    makeYellowStar(-0.29,0.29);
    makeYellowStar(0.74,0.775);
    makeYellowStar(0.945,-0.18);
    makeYellowStar(0,0.8);
    makeYellowStar(0.615,0.105);
    makeYellowStar(-0.65,0.915);
    makeYellowStar(0.26,0.875);
    makeYellowStar(0.52,0.625);
    makeYellowStar(-0.145,0.63);
    makeSun(-0.515,0.745);
    renderAllShapes();
    explosion(-0.515,0.745);

    // Set an interval to repeatedly double the size every 2 seconds until it reaches max size of 40
    let interval = setInterval(() => {
      let size = 400;
      point = new Circle(55);
      point.color = [1, 1, 0, 1];
      point.size = size; // initial size
      point.position = [x, y];
      g_shapesList.push(point);
      renderAllShapes();
  }, 6000); // 2000ms = 2 seconds

}

function makeYellowStar(x, y){
  point = new Point();
  point.color = [1, 1, 0, 1];
  point.size = 5; // max size is 40
  point.position = [x, y];
  g_shapesList.push(point);
}
function makeSun(x, y){
  point = new Circle(55);
  point.color = [1, 0, 0, 1];
  point.size = 5; // max size is 40
  point.position = [x, y];
  g_shapesList.push(point);
}

function explosion(x, y) {
  let size = 15;
  let point = new Circle(55);
  point.color = [1, 0, 0, 1];
  point.size = size; // initial size
  point.position = [x, y];
  g_shapesList.push(point);
  renderAllShapes();

  // Set an interval to repeatedly double the size every 2 seconds until it reaches max size of 40
  let interval = setInterval(() => {
    point.size = Math.min(point.size * 2, 1000); // Double the size, but don't exceed max size of 40
    renderAllShapes();
    if (point.size >= 400) {
      clearInterval(interval); // Stop the interval once the size reaches 40
    }

  }, 1000); // 2000ms = 2 seconds

}

  // Function to convert radians to degrees
 function degreesToRadians(degree) {
    return degree * (Math.PI/180);
  }

  // Function to update the angle in the HTML element
  function updateAngleDisplay(angle) {
    var angleInDegrees = degreesToRadians(angle);  // Convert to degrees
    return angleInDegrees;
  }

  function triangle_draw(){
      // (0, 0) is the origin, aka middle of the screen
  let x = 0;
  let y = -0.5;
  
  // Left Half Column 1
  x = 0;
  for(y= -0.5; y < 0.40; y = y + 0.15){
    point = new Triangle(updateAngleDisplay(180));
    point.position = [x, y];
    point.color = [1, 0, 0.71, 1];
    point.size = 30; // max size is 40
    g_shapesList.push(point);
  }
  x = -0.15;
  for(y= -0.5; y < 0.40; y = y + 0.15){
    point = new Triangle(updateAngleDisplay(0));
    point.position = [x, y];
    point.color = [1, 0, 0.71, 1];
    point.size = 30; // max size is 40
    g_shapesList.push(point);
  }

  // Left Half Column 2
  for(y= -0.35; y < 0.55; y = y + 0.15){
    point = new Triangle(updateAngleDisplay(180));
    point.position = [x, y];
    point.color = [1, 0, 0.71, 1];
    point.size = 30; // max size is 40
    g_shapesList.push(point);
  }

  x = -0.3;
  for(y= -0.35; y < 0.40; y = y + 0.15){
    point = new Triangle(updateAngleDisplay(0));
    point.position = [x, y];
    point.color = [1, 0, 0.71, 1];
    point.size = 30; // max size is 40
    g_shapesList.push(point);
  }

    // Left Half Column 3
    for(y= -0.20; y < 0.40; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(180));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }
    x=-0.45;
    for(y= -0.20; y < 0.25; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(0));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }

    // Left Half Column 4
    for(y= -0.05; y < 0.40; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(180));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }
    x=-0.6;
    for(y= -0.05; y < 0.10; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(0));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }
    
    // Left Corner
    x = -0.45;
    y = 0.25;
    point = new Triangle(updateAngleDisplay(90));
    point.position = [x, y];
    point.color = [1, 0, 0.71, 1];
    point.size = 30; // max size is 40
    g_shapesList.push(point);

  // Right Half Column 1
  x = 0;
  for(y= -0.5; y < 0.40; y = y + 0.15){
    point = new Triangle(updateAngleDisplay(270));
    point.position = [x, y];
    point.color = [1, 0, 0.71, 1];
    point.size = 30; // max size is 40
    g_shapesList.push(point);
  }
  x = 0.15;
  for(y= -0.5; y < 0.40; y = y + 0.15){
    point = new Triangle(updateAngleDisplay(90));
    point.position = [x, y];
    point.color = [1, 0, 0.71, 1];
    point.size = 30; // max size is 40
    g_shapesList.push(point);
  }

    // Right Half Column 2
    for(y= -0.35; y < 0.55; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(270));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }
  
    x = 0.3;
    for(y= -0.35; y < 0.40; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(90));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }

    // Right Half Column 3
    for(y= -0.2; y < 0.40; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(270));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }
  
    x = 0.45;
    for(y= -0.2; y < 0.25; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(90));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }

    // Right Half Column 4
    for(y= -0.05; y < 0.4; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(270));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }
  
    x = 0.6;
    for(y= -0.05; y < 0.1; y = y + 0.15){
      point = new Triangle(updateAngleDisplay(90));
      point.position = [x, y];
      point.color = [1, 0, 0.71, 1];
      point.size = 30; // max size is 40
      g_shapesList.push(point);
    }

    // Right Corner
    x = 0.45;
    y = 0.25;
    point = new Triangle(updateAngleDisplay(0));
    point.position = [x, y];
    point.color = [1, 0, 0.71, 1];
    point.size = 30; // max size is 40
    g_shapesList.push(point);

  renderAllShapes();
  }