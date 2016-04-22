MagicCrop
=========

A JavaScript library to automatically detect and extract a photo from a screenshot.

Why use this? Many apps don't allow you to save images to your camera roll. You can work around this by taking a screenshot of the photo and manually cropping it using a third party app like Photoshop Express.

This library attempts to automate that process.  Give it a screenshot containing a photo, and it will detect the cropping bounds of the photo and output a new HTML Canvas element containing the cropped image.

The algorithm is application/image agnostic and has been tested with screenshots taken from many different apps.

![Extraction](https://raw.githubusercontent.com/mikechamberlain/magic-crop/master/test/images/extracted.jpg)

Installation
------------
```shell
bower install magic-crop
```
 
```html
<script src="bower_components/magic-crop/src/magicCrop.js></script>
```

or

```shell
npm install magic-crop
```

```javascript
var MagicCrop = require('magic-crop')
```

Usage
-----

```javascript
// load the URL to crop into an HTML Image element
var imageElem = new Image();
imageElem.src = 'screenshotToCrop.png';
imageElem.onload = function () {
    crop(imageElem);
}

function crop(imageElem) {
    var magicCrop = new MagicCrop();
        
    // get the image data
    var imageData = magicCrop.getImageData(imageElem);
    
    // calculate the cropping bounds
    var bound = magicCrop.calcCroppingBounds(imageData.data.buffer, imageData.width, imageData.height);

    // perform the crop
    var croppedCanvas = magicCrop.cropToCanvas(imageElem, bound);

    // do something with the cropped canvas
    var croppedImage = new Image();
    croppedImage.src = croppedCanvas.toDataURL('image/png');
}
```
Demo
----
Clone, install dev dependencies, then run the demo:

```shell
git clone https://github.com/mikechamberlain/magic-crop.git
cd magic-crop
npm install
npm run demo
```

The `index.html` page will open in your browser.
Development
-----------
Clone, install dev dependencies, then run the tests:

```shell
git clone https://github.com/mikechamberlain/magic-crop.git
cd magic-crop
npm install
npm run test
```
The tests will run and watch for changes.

How it works
------------
High level overview of the algorithm:

Attempts to automatically calculate the cropping bound `{ minX, minY, maxX, maxY }`
for the given the `[ImageData](https://developer.mozilla.org/en/docs/Web/API/ImageData)` that contains a photo within.

Algorithm is:
 1. Calculate the 3 most popular colors across the entire image. Consider these our *background colors*.
 2. Sample some "randomly" distributed points around the image, and from each point work in all four directions towards each edge.
 3. If, in any direction, we hit a *background color*, OR we make it to the *edge*, then store this as a potential cropping bound for that direction.
 4. For each of the 4 potential bounds calculated above, choose the most popular (mode) for each edge, to represent our final crop region.
 5. Apply this crop region to our original image.
    
Crop Magic iPhone App
---------------------
The MagicCrop library powers the [Crop Magic](https://itunes.apple.com/us/app/crop-magic/id1061397658?mt=8) iPhone application.

[![Available on the App Store](https://raw.githubusercontent.com/mikechamberlain/magic-crop/master/test/images/app-store.png)](https://itunes.apple.com/us/app/crop-magic/id1061397658?mt=8)

 
