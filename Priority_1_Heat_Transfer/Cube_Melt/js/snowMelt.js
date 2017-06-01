/* File: snowMelt.js
 * Dependencies: CubeMeltExp.js
 * 
 * Authors: Daniel Vasquez and Brooke Bullek (May 2017)
 *          Under the supervision of Margot Vigeant, Bucknell University
 * (c) Margot Vigeant 2017
 */

/******************* Constants **********************/

var ICE_FREEZE_TEMP_K = 273.15; // Temperature of ice at freezing point in Kelvin
var ICE_DENSITY = 917; // Density of ice in kg/m^3
var MAX_DIVISIONS = 5; // Maximum number of times user can break the ice block
var BASE_WIDTH_SCALING = 9; // Amount to divide windowWidth by to get size of ice block
var BROKEN_ICE_DIV_ID = "brokenIceCanvas-holder"; // For placing p5 canvases
var UNBROKEN_ICE_DIV_ID = "unbrokenIceCanvas-holder";
var LEFT_BLOCK_OFFSET_SCALING = 0.15; // Multiplied by the window width
var RIGHT_BLOCK_OFFSET_SCALING = 0.35;

/**************** Global variables ******************/

var iceCanvas;
var baseWidth = 100; // Number of pixels along one edge of an unbroken ice block
var numDivisions = -1;
var array = [];
var arrayPos = {x:100, y:100};
var holdingHammer = false;
var ctx;
var myLineChart;
var unbrokenExp;
var brokenExp;
var unbrokenExpBeaker;
var brokenExpBeaker;

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

    responsive: true
  }
};

/***************** Experiment setup *****************/

function initializeChart() {
  ctx = document.getElementById("myChart").getContext("2d");
  myLineChart = new Chart(ctx, chartData);
}

function setup() {
  baseWidth = windowWidth / BASE_WIDTH_SCALING;

  // Create both ice visualizations and initialize them
  brokenExp = new CubeMeltExp();
  unbrokenExp = new CubeMeltExp();
  cubeMeltSetup();

  // Create both beakers and initialize them
  unbrokenExpBeaker = new Beaker();
  brokenExpBeaker = new Beaker();
  beakerSetup();
 
  toggleHammer();
  initializeChart();
  windowResized();

  //noLoop();
}

function draw() {
  // Clear the canvas
  background(255, 255, 255);

  //myLineChart.data.datasets[0].data[0] += 1;
  //myLineChart.update();

  /* Begin logic for controlling appearance of cursor */
  if (holdingHammer) {
    if (mouseIsPressed) {
      cursor('hammer_click.cur', 0, 0); // Sets cursor to hammer_click.cur
    } else {
      cursor('hammer_hover.cur', 0, 0);
    }
  } else {
    cursor(ARROW, 0, 0); // Sets cursor to default arrow
  }
  /* End logic for controlling appearance of cursor */

  // Draw the ice blocks
  brokenExp.display();
  unbrokenExp.display();

  // Draw the beakers
  unbrokenExpBeaker.display();
  brokenExpBeaker.display();

  // Paint the off-screen buffers onto the main canvas
  image(unbrokenExpBeaker.buffer, 0, windowHeight / 2);
  image(brokenExpBeaker.buffer, windowWidth / 4, windowHeight / 2);
}

function windowResized() {
  resizeCanvas(windowWidth / 2, windowHeight); // TODO Remove dependence on window

  // Update variables that scale with screen size
  unbrokenExp.xOffset = windowWidth * LEFT_BLOCK_OFFSET_SCALING;
  brokenExp.xOffset = windowWidth * RIGHT_BLOCK_OFFSET_SCALING;
  baseWidth = windowWidth / BASE_WIDTH_SCALING;
  unbrokenExp.resize();
  brokenExp.resize();
}

/************ Math and science functions ************/

/*
 * Finds the melting time for the cubes in each beaker to set up the animation 
 * fade time.
 */
function findMeltingTime() {
  simulationSetup();
  findMeltStep();
  simulationSetup();
  findMeltStep2();
  simulationSetup();
}

/*
 * The actual simulation. Calculates temperature and plots it.
 */
function measureSimulation() {
  if (currentStep < numDataPts) {
    Qmelt = (waterT-(Cice+CtoKelvin))*h*surfArea*timeStep;
    //alert("Qmelt: " + Qmelt);
    iceMelt = Qmelt/hfusion;
    //alert("iceMelt: " + iceMelt);
    iceMassOld = iceMass;
    iceMass = iceMassOld - iceMelt;
    //alert("iceMass: " + iceMass);
    if (iceMass > 0.1) {
      tempT = waterT - Qmelt/((iceMelt+waterMass)*joulesPerCal);
      //alert("tempT: " + tempT);
      waterT = (waterMass*tempT + iceMelt*(Cice+CtoKelvin))/(iceMelt+waterMass);
      //alert("waterT: " + waterT);
      waterMass = waterMass + iceMelt;
      //alert("waterMass: " + waterMass);
      surfArea = iceMass/iceMassOld*surfArea;
    }

    Qmelt2 = (waterT2-(Cice+CtoKelvin))*h*surfArea2*timeStep;
    iceMelt2 = Qmelt2/hfusion;
    iceMassOld2 = iceMass2;
    iceMass2 = iceMass2 - iceMelt2;
    if (iceMass2 > 0.1) {
      tempT2 = waterT2 - Qmelt2/((iceMelt2+waterMass2)*joulesPerCal);
      waterT2 = (waterMass2*tempT2 + iceMelt2*(Cice+CtoKelvin))/(iceMelt2+waterMass2);
      waterMass2 = waterMass2 + iceMelt2;
      surfArea2 = iceMass2/iceMassOld2*surfArea2;
    }

    // Plots every other data point
    if (currentStep % 2 == 0) {
      x1 = 38 + currentStep + "px";
      x2 = 39 + currentStep + "px";

      y1 = (graphHeight - (waterT-CtoKelvin)*(graphHeight/maxTemp) + 68); + "px";
      y2 = (graphHeight - (waterT2-CtoKelvin)*(graphHeight/maxTemp) + 68); + "px";

      if ((y2-y1) < 1.5) {
        y2 = y2 + "px";
        y1 = y2;
      } else {
        y1 = y1 + "px";
        y2 = y2 + "px";
      }

      var dot1 = "#sit1Point" + (currentStep/2);
      var dot2 = "#sit2Point" + (currentStep/2);
      $(dot1).css({top:y1, left:x1});
      $(dot2).css({top:y2, left:x2});
      $(dot1).show();
      $(dot2).show();
    }

    currentStep++;
    setTimeout(measureSimulation, 40);
  } else {
    $("#resetButton").removeAttr("disabled");
  }
}

/************** Animation functions *****************/

/* 
 * Toggles holding the hammer. Replaces the cursor with a hammer graphic.
 */
function toggleHammer() {
  holdingHammer = !holdingHammer;
  if (holdingHammer) {
    cursor('hammer_hover.cur', 0, 0);
  } else {
    cursor(ARROW, 0, 0);
  }
}

/* 
 * Attempts to break the ice further. Does nothing if MAX_DIVISIONS is reached.
 */
function swingHammer() {
  if (brokenExp.numDivisions < MAX_DIVISIONS && cursorOverBrokenExp()) {
    print("Breaking ice");
    brokenExp.numDivisions += 1;
    breakAnimation();
    brokenExp.setDivisions(brokenExp.numDivisions);
  }

  else {
    print("The ice couldn't be broken further");
    noBreakAnimation();
  }
}

/* 
 * Animation for the breaking of user-breakable ice block.
 */
function breakAnimation() {
  // Spawn strike sparks
  return
}

/* 
 * Animation indicating that the ice couldn't be broken.
 */
function noBreakAnimation() {
  // Spawn dust/poof/smoke particles
  return
}

/*********** User interaction functions *************/

function mousePressed() {
  swingHammer();
}

/**
 * Detect whether the cursor is hovering over the breakable ice block.
 */
function cursorOverBrokenExp() {
  var xLeft = brokenExp.xOffset - brokenExp.findArrayRange() / 2;
  var xRight = brokenExp.xOffset + brokenExp.findArrayRange() / 2;
  var yTop = brokenExp.yOffset - brokenExp.findArrayRange() / 2;
  var yBottom = brokenExp.yOffset + brokenExp.findArrayRange() / 2;
  return (mouseX >= xLeft && mouseX <= xRight) &&
         (mouseY >= yTop && mouseY <= yBottom);
}
