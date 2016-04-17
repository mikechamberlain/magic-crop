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
 
`<script src="bower_components/magic-crop/src/magicCrop.js></script>`

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
Crop Magic iPhone App
---------------------
The MagicCrop library powers the [Crop Magic](https://itunes.apple.com/us/app/crop-magic/id1061397658?mt=8) iPhone application.

[![Available on the App Store](https://raw.githubusercontent.com/mikechamberlain/magic-crop/master/test/images/app-store.png)](https://itunes.apple.com/us/app/crop-magic/id1061397658?mt=8)

 
