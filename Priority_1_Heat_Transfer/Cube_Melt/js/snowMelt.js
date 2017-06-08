/* File: snowMelt.js
 * Dependencies: IceCube.js, Cup.js, Experiment.js
 *
 * Authors: Daniel Vasquez and Brooke Bullek (May 2017)
 *          Under the supervision of Margot Vigeant, Bucknell University
 * (c) Margot Vigeant 2017
 */

/******************* Constants **********************/

var ROOM_TEMPERATURE = 295; // Room temperature in Kelvin
var ICE_FREEZE_TEMP_K = 273.15; // Temperature of ice at freezing point in Kelvin
var ICE_DENSITY = 0.917; // Density of ice in g/cm^3
//var WATER_DENSITY = ;
//var CUP_VOLUME = ;
var MASS_CUP_OF_WATER = 500; // Mass in grams of a "cup" of water. NOTE: Not actual cup unit

var HEAT_CAPACITY_WATER = 4.205; /* Joules of heat for the temperature of one
  gram of water to increase 1 degrees Celcius.*/
var DELTA_H_FUS_WATER = 333.86; // (Latent) heat of fusion of water in joules per gram.
var H = 100; // Free water convection (Wm^-2K^-1) // Heat transfer constant

var MAX_DIVISIONS = 5; // Maximum number of times user can break the ice block
var BASE_WIDTH_SCALING = 11.5; // Amount to divide windowWidth by to get size of ice block
var BROKEN_ICE_DIV_ID = "brokenIceCanvas-holder"; // For placing p5 canvases
var UNBROKEN_ICE_DIV_ID = "unbrokenIceCanvas-holder";
var FRAME_RATE = 60; // Frames per second. The rate at which the draw function is called.

/**************** Global variables ******************/

var iceCanvas;
var baseWidth; // Number of pixels along one edge of an unbroken ice block
var ctx;
var hasChanged; // Cuts down on calculations inside the draw() function
var mouseIsPressed;

// Pieces of the experiment
var unbrokenIce;
var brokenIce;
var unbrokenExp;
var brokenExp;

// For enabling web transitions on pop-up help tooltip
var helpBoxPopUp;
var helpBtn;

/********** Configuration data for chart ************/

var chartData = {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Broken Ice',
        data: [{x:0, y:1}, {x:1, y:2}]
      },
      {
        label: 'Unbroken Ice',
        backgroundColor: "rgba(75, 192, 192, 0.4)",
        data: [{x:0, y:2}, {x:1, y:0}]
      }
    ]
  },

  options: {
    pan: {
      enabled: true,
      mode: 'xy'
      //rangeMin:{x: null, y: null},
      //rangeMax:{x: null, y: null}
    },

    zoom: {
      enabled: true,
      drag: false,
      mode: 'y'
      //rangeMin:{x: null, y: null},
      //rangeMax:{x: null, y: null}
    },

    legend: {
      display: true,
      position: 'bottom'
    },

    responsive: true,
    maintainAspectRatio: false
  },
};

/***************** Experiment setup *****************/

function initializeChart() {
  ctx = document.getElementById("myChart").getContext("2d");
  myLineChart = new Chart(ctx, chartData);
}

function setup() {
  // Lock pixel density to avoid cropping when user zooms in on browser
  pixelDensity(1);

  mouseIsPressed = false;

  baseWidth = windowWidth / BASE_WIDTH_SCALING;

  // Create both ice cubes and initialize them
  brokenIce = new IceCube();
  unbrokenIce = new IceCube();

  // Hook up the ice cubes to their respective experiments
  unbrokenExp = new Experiment('unbroken', unbrokenIce);
  brokenExp = new Experiment('broken', brokenIce);
  unbrokenExp.init();
  brokenExp.init();
  iceCubeCanvasSetup();

  initializeChart();
  windowResized();

  hasChanged = true; // Force the draw function to execute
}

function draw() {
  updateCursor();
  updateSimulation();

  // Don't re-render/recalculate drawings if they haven't been updated
  if (!hasChanged) {
    return;
  }

  // Clear the canvas
  background(255, 255, 255);

  drawTitle();

  //myLineChart.data.datasets[0].data[0] += 1;
  //myLineChart.update();

  unbrokenExp.display();
  brokenExp.display();
}

/*
 * Writes the title of the page towards the top of the canvas.
 */
function drawTitle() {
  // Set exact font to avoid inconsistencies between browsers
  textFont("Helvetica");

  /* When the window is longer than it is wide (e.g. mobile), draw the text
   * on top of each other instead of side-by-side for readability
   */
  var windowRatio = windowWidth / windowHeight;

  if (windowRatio < 1) {
    // Mobile layout
    var fontSize = windowWidth / 2 / 24;
    textSize(fontSize);

    var fontPosX = windowWidth / 8;
    var fontPosY = windowHeight / 24;

    fill(32, 32, 32); // grey
    text("Rate vs. Amount: ", fontPosX * 1.4, fontPosY);
    fill(0, 102, 153); // blue
    text("Melting Ice Simulation", fontPosX * 1.2, fontPosY * 1.45);
  }
  else {
    // Standard/desktop
    var fontSize = windowWidth / 2 / 32;
    textSize(fontSize);

    var fontPosX = windowWidth / 10;
    var fontPosY = windowHeight / 24;

    fill(32, 32, 32); // grey
    text("Rate vs. Amount: ", fontPosX, fontPosY);
    fill(0, 102, 153); // blue
    text("Melting Ice Simulation", fontPosX * 2.25, fontPosY);
  }
}

/*
 * Built-in p5 function; called whenever the browser is resized.
 */
function windowResized() {
  resizeCanvas(windowWidth / 2, windowHeight);

  // Update variables that scale with screen size
  baseWidth = windowWidth / BASE_WIDTH_SCALING;
  unbrokenExp.resize();
  brokenExp.resize();

  hasChanged = true;
}

/*********** User interaction functions *************/

/*
 * Controls the appearance of the cursor, which looks like a hammer when hovering
 * over the ice cubes and looks like a red X when the ice can't be broken further.
 */
function updateCursor() {
  // Ice has already fallen and can't be broken now
  if (unbrokenExp.ice.hasDropped) {
    cursor(ARROW);
  }
  // Ice hasn't fallen yet; mouse button isn't pressed
  else if (!mouseIsPressed) {
    if (cursorOverIceCubes()) {
      cursor('hammer_hover.cur');
    } else {
      cursor(ARROW);
    }
  }
  // Mouse is pressed
  else {
    if (cursorOverIceCubes()) {
      // If clicking on a breakable ice cube, show the hammer cursor
      if (brokenExp.cursorIsOverIce() && brokenExp.ice.canBeBrokenFurther()) {
        cursor('hammer_click.cur');
      }
      // Else, show a red X because the user can't break this ice
      else {
        cursor('red_x.cur', -10, -10);
      }
    }
    else {
      cursor(ARROW);
    }
  }
}

/*
 * Built-in p5 function; called whenever the user clicks the mouse.
 */
function mousePressed() {
  mouseIsPressed = true;
  swingHammer();
}

/*
 * Built-in p5 function; called whenever the user releases the mouse.
 */
function mouseReleased() {
  mouseIsPressed = false;
}

/*
 * Attempts to break the ice further. Does nothing if MAX_DIVISIONS is reached.
 */
function swingHammer() {
  if (brokenExp.cursorIsOverIce() && brokenExp.ice.canBeBrokenFurther()) {
    brokenExp.ice.setDivisions(brokenExp.ice.numDivisions + 1);
    hasChanged = true;
  }
}

/************ Math and science functions ************/

/*
 * Advances the simulation by updating the mathematical calculations. All functions of
 * this nature should be put here in order to run once per draw() loop.
 */
function updateSimulation() {
  unbrokenExp.updateCalculations();
  brokenExp.updateCalculations();

  // stepSimulation(brokenExp);
}

/* Calculates the changes in the simulation over dt, the change in time over
 * a loop of the draw function which is called 60 times a second.
 * @param exp: An Experiment object
 */
function stepSimulation(exp) {
  // Consider the IceCube from the given Experiment obj.
  var ice = exp.ice;

  print("exp.name:", ice.name);
  print("exp.iceMass:", ice.iceMass);
  var dt = 1/FRAME_RATE; // inverse of the expected framerate.
  print("period is:", dt);
  var n = ice.numPieces; // The number of pieces in the whole ice
  print("n is:", n);
  var aOne = findAreaOfOneIcecubeFromMass(ice.iceMass, n);
  print("aOne is:", aOne);
  print("tempWater is:", ice.waterTemp);
  var q = findQ(aOne, n, ice.waterTemp, dt);
  print("q is:", q);
  var mMelted = findM_melted(q); // The mass of the liquid created from melting ice.
  ice.waterTemp = findT_waterNewMelting(ice.waterMass, ice.waterTemp, mMelted);
  print("Melted, waterTemp is:", ice.waterTemp);
  ice.waterTemp = findT_waterNewMixing(ice.waterMass, ice.waterTemp, mMelted);
  ice.waterMass += mMelted; // Add new liquid to water
  ice.iceMass -= mMelted;   // Remove melted mass from ice
  ice.edgeLength = findEdgeLength(aOne); // Store piece edgelength for drawing
  graphTemperature(ice.waterTemp, ice.name); // TODO: This function should be called in draw
}

/* TODO: This function is not in use, remove later
 *
 */
function findAreaOfOneIcecubeFromLength(initLength, divisions) {
  return pow((initLength/pow(2, divisions)), 3);
}

/* Determines the total area of ice divided into n parts.
 * @param iceMass: the mass of the whole
 * @param n: the number of parts in the whole
 */
function findAreaOfOneIcecubeFromMass(iceMass, n) {
  return 6*pow(iceMass/(n*ICE_DENSITY),2/3);
}

/* Shortcut function that calculates the area of an icecube given it's mass.
 * TODO: This function is not used, remove later
 * @param iceMass: the mass of the whole
 */
function findAreaFromMass(iceMass) {
  return findAreaOfOneIcecubeFromMass(iceMass, 1);
}



/*
 * Finds the melting time for the cubes in each cup to set up the animation
 * fade time.
 * Calculates heat transfer due to water making contact with ice surface.
 * @param aOne: The area of one ice cube. Units in mm^2. TODO: This should be cm^2?
 * @param n: number of ice cubes.
 * @param tempWater: The current temperature of the water.
 * @param dt: change in time. Units in seconds.
 * @return The heat exchanged.
 */
function findQ(aOne, n, tempWater, dt) {
  return dt * H * (aOne * n) * (ICE_FREEZE_TEMP_K - tempWater);
}

/*
 * Calculates the mass of ice melted and converted to liquid water.
 * @param q: The heat exchanged resulting in the ice melting.
 * @return Mass of the melted ice.
 */
function findM_melted(q) {
  return q / DELTA_H_FUS_WATER;
}

/*
 * Calculates the new temperature of the water after the ice melts a bit.
 * @param q: The heat exchanged resulting in the ice melting.
 * @param tempWater: The current temperature of the water.
 * @param mWaterOld: The current mass of the water.
 * @return The new temperature of the water. (Kelvin)
 */
function findT_waterNewMelting(q, tempWater, mWaterOld) {
  return q / (HEAT_CAPACITY_WATER * mWaterOld) + tempWater;
}

/*
 * Calculates the new temperature of the water after mixing in the melted ice.
 * @param mWater: The current mass of the water.
 * @param tempWater: The current temperature of the water (after previous calculation steps)
 * @param mMelted: The mass of melted ice.
 * @return Temperature of water after mixing. (Kelvin)
 */
function findT_waterNewMixing(mWater, tempWater, mMelted) {
  return ((mWater * tempWater) + (mMelted * ICE_FREEZE_TEMP_K)) / (mWater * mMelted);
}

/* Finds the length of one edge of a cube given the surface area of that cube.
 * @param surfaceArea: The surface area of a particular cube
 * @return The length of one edge of the cube
 */
function findEdgeLength(surfaceArea) {
  return sqrt(surfaceArea/6);
}

/*************** Chart Functionality ****************/

/* Graphs a temperature datapoint. Assumes constant period (1/FRAME_RATE) between adjacent points.
 * Assumes points aren't being skipped!
 * @param temperature: The new temperature value to be graphed
 * @param name: The identifying string for a dataset to be appended to (found in IceCube.name)
 */
function graphTemperature(temperature, name) {
  var period = 1/FRAME_RATE;
  var dataSetIndex; // The value
  if (name === "broken") {
    dataSetIndex = 0;
  } else if (name === "unbroken") {
    dataSetIndex = 1;
  } else {
    print("Tried to add data to", name, "which is not recognized by graphTemperature()");
    return // Stop before attempting insertion of data point
  }
  var i = chartData.data.datasets[dataSetIndex].data.length-1; // index for the last element in data
  var prevTime = chartData.data.datasets[dataSetIndex].data[i].x;
  chartData.data.datasets[dataSetIndex].data.push({x:prevTime + period, y:temperature});
  myLineChart.update();
  return;
}

/**** Code to interface with HTML elements (e.g. bootstrap btns) ****/

// jQuery code to register button clicks and link them to appropriate JS functions
$(document).ready(function(){
  // For enabling web transitions on pop-up help tooltip
  helpBoxPopUp = document.getElementById('help-box');
  helpBtn = document.getElementById('helpBtn');
  helpBtn.addEventListener("click", function(){
    helpBoxPopUp.classList.toggle("appear");
  }, false);
  
  // Button interactions
  $("#startBtn").click(function () {
    startSimulation();
    $('#startBtn').attr('disabled','disabled');
  });

  $("#resetBtn").click(function () {
    resetSimulation();
    $("#startBtn").removeAttr('disabled');
  });

  $("#helpBtn").click(function () {
    toggleHelp(helpBoxDiv);
  });
});

/*
 * Called when the user presses the green 'Start' button. Begins the simulation
 * by dropping the ice cubes and beginning to run through the calculations.
 */
function startSimulation() {
  // Don't allow the simulation to be started a second time
  if (!brokenExp.ice.hasDropped) {
    brokenExp.beginDroppingIce();
    unbrokenExp.beginDroppingIce();
  }
}

/*
 * Called when the user presses the red 'Restart' button. Resets the states of both
 * ice cubes as well as the chart.
 */
function resetSimulation() {
  // Calling the p5 setup function will reset all onscreen elements
  setup();
}

/*
 * Called when the user presses the help button. Alternatively hides or un-hides the
 * blue tooltip box that appears beneath the chart and buttons.
 */
function toggleHelp(element) {
  if (element.style.display === 'none') {
    show(element);
  } else {
    hide(element);
  }
}
