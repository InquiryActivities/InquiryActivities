

function setup() {
  createCanvas(displayWidth, displayHeight);
  mgr = new SceneManager();
      // Preload scenes. Preloading is normally optional
      // ... but needed if showNextScene() is used.
      mgr.addScene ( Intro );
      mgr.addScene ( Editor );
      mgr.showNextScene();

  print("initialized");
}
function draw() {
  mgr.draw();
}
