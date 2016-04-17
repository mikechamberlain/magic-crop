MagicCrop
=========

A JavaScript library to automatically detect and extract a photo from a screenshot.

![Extraction](https://raw.githubusercontent.com/mikechamberlain/magic-crop/master/test/images/extracted.jpg)

Installation
------------
Install from bower:

```shell
bower install magic-crop
```
Usage
-----
Add a reference to the MagicCrop script:
 
```html
<script src="bower_components/magic-crop/src/magicCrop.js></script>
```

Then use the library as follows:

```javascript
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
    
// load the URL to crop into an HTML Image element
var imageElem = new Image();
imageElem.src = 'screenshotToCrop.png';
imageElem.onload = function () {
    crop(imageElem);
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

1. Calculate most popular colors across the entire image. These are our background colors.
2. Sample a bunch of points across the image and work towards each edge, looking for a background color found in 1.
3. When we find a background color pixel, or we hit the edge, store this value as a potential bound.
4. From the potential bounds calculated in 3, choose the most popular to represent our final crop region.
5. Apply this crop region to our original image.

Crop Magic iPhone App
---------------------
The MagicCrop library powers the [Crop Magic](https://itunes.apple.com/us/app/crop-magic/id1061397658?mt=8) iPhone application.

[![Available on the App Store](https://raw.githubusercontent.com/mikechamberlain/magic-crop/master/test/images/app-store.png)](https://itunes.apple.com/us/app/crop-magic/id1061397658?mt=8)

 
