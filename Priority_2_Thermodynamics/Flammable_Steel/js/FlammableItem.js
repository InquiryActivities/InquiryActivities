/* File: FlammableItem.js
 * Author: Brooke Bullek (June 2017)
 *         Under the supervision of Margot Vigeant, Bucknell University
 */

/*
 * A base class from which the Steel and Wood classes inherit.
 */
function FlammableItem(isMutable) {
  this.isMutable = isMutable;  // True for the item on the right
  this.hasCaughtFire = false;
  this.img;

  /* Graphical properties */
  this.width;
  this.height;
  this.xOffset;
  this.yOffset;

  /*
   * Sets the graphical properties of this object based on the window size.
   */
  this.resize = function() {
    this.width = windowWidth * config['itemWidthRatio'];
    var aspectRatio = this.img.elt.width / this.img.elt.height;
    this.height = this.width / aspectRatio;

    // Horizontal offset depends on which item (left or right) is being drawn
    if (this.isMutable) {
      this.xOffset = windowWidth * config['itemRightXOffsetRatio'];
    } else {
      this.xOffset = windowWidth * config['itemLeftXOffsetRatio'];
    }

    this.yOffset = windowHeight * config['itemYOffsetRatio'] - this.height / 2;
  }

  /*
   * Renders this image onscreen.
   */
  this.draw = function() {
    if (this.img == images['wood1']) { // Draw wood planks img a little smaller
      image(this.img, this.xOffset + this.width * 0.1, this.yOffset + this.height * 0.1, 
        this.width * 0.8, this.height * 0.8);
    }
    else {
      image(this.img, this.xOffset, this.yOffset, this.width, this.height);
    }
  }

  /*
   * Updates the image used to represent this flammable item.
   * @param imageID: A string used to index into the global var of images
   */
  this.changeImage = function(imageID) {
    // Immutable items can't change in appearance
    if (this.isMutable) {
      this.img = images[imageID];
      this.resize();
    }
  }

  /*
   * Returns true if the cursor is hovering over this item.
   */
  this.cursorIsOver = function() {
    return (mouseX > this.xOffset && mouseX < this.xOffset + this.width
         && mouseY > this.yOffset && mouseY < this.yOffset + this.height);
  }
}
