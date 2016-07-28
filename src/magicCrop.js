'use strict';

var MagicCrop = function () {

    // Attempts to automatically calculate the cropping bound { minX, minY, maxX, maxY }
    // for the given the ImageData (https://developer.mozilla.org/en/docs/Web/API/ImageData) that contains a photo within.
    //
    // Algorithm is:
    // 1. Calculate the 3 most popular colors across the entire image. Consider these our *background colors*.
    // 2. Sample some "randomly" distributed points around the image, and from each point work in all four directions towards each edge.
    // 3. If, in any direction, we hit a *background color*, OR we make it to the *edge*, then store this as a potential cropping bound for that direction.
    // 4. From each of the 4 sets of potential bounds calculated above, choose the most popular (mode) from each. These describe our final crop region.
    // 5. Apply this crop region to our original image.
    //
    // In the iOS Crop Magic app, this function is called from the Angular Webworker library, as described here:
    // https://github.com/mattslocum/ng-webworker
    // For use with this library, it's required that our background function:
    // 1. is *fully self contained*, so all dependent functions are defined inside it, and
    // 2. can take advantage of *WebWorker transferable objects*: http://w3c.github.io/html/infrastructure.html#transferable-objects.
    // This allows us to process the cropping of each image in the backgound, keeping the UI responsive.
    // This means that we've stuffed all the supporting functions inside the main one, which is perhaps not the best coding style.
    // This could be improved by including a build step that builds the web-worked enabled function from its constituent parts.
    this.calcCroppingBounds = function (imageBytes, width, height) {

        // todo: Make these magic numbers configurable? Through trial and error they work well for the general case...

        // The number of potential background color candidates to consider.
        var bgColorCount = 3;
        // When calculating the background color(s), for speed sample only 1 out of every n pixels - it's all the same really.
        var bgColorSampleRatio = 100;
        // When scanning the image for bounds, do not sample this outer fraction of the image. This is usually where the solid
        // headers/footers lie.
        var boundsDetectionPaddingFraction = 0.2;
        // When scanning the image for bounds, take this many samples inside the padding described above.
        var boundsDetectionSampleCount = 15;
        // If we determine a bound is not the edge of the image, crop an additional number of pixels to avoid any anti-aliasing artifacts.
        var antiAliasFiddle = 2;

        // reconstruct the ImageData object that we had to pass in as primitives
        var imageData = {
            data: new Uint8ClampedArray(imageBytes),
            width: width,
            height: height
        };

        if (imageData.data.length === 0) {
            throw new Error('Empty image');
        }

        var expectedBytes = width * height * 4;
        if (expectedBytes != imageData.data.length) {
            throw new Error('Inconsistent width / height for supplied image data. Expected ' +
                expectedBytes + ' bytes but received ' + imageData.data.length);
        }

        // Converts a decimal value to a pixel data structure. 'decimal' is a really bad name.
        function toPixel(decimal) {
            return {
                r: decimal >>> 24 & 0xFF,
                g: decimal >>> 16 & 0xFF,
                b: decimal >>> 8 & 0xFF,
                a: decimal & 0xFF,
                decimal: decimal
            }
        }

        // Calculates the decimal value represented by the given RGBA components.
        function toDecimal(r, g, b, a) {
            return (r << 24) + (g << 16) + (b << 8) + a;
        }

        // Extracts the pixel from the byte array at the given offset.
        function getPixelAtOffset(bytes, offset) {
            var r = bytes[offset + 0];
            var g = bytes[offset + 1];
            var b = bytes[offset + 2];
            var a = bytes[offset + 3];

            return {
                r: r,
                g: g,
                b: b,
                a: a,
                decimal: toDecimal(r, g, b, a)
            };
        }

        // Extracts the pixel from the image for the given coordinate.
        function getPixelAt(imageData, x, y) {
            var offset = ((y * (imageData.width * 4)) + (x * 4));
            return getPixelAtOffset(imageData.data, offset);
        }

        // When passed to Array.sort, sorts numerically ascending.
        function asc(a, b) {
            return a - b;
        }

        // When passed to Array.sort, sorts numerically descending.
        function desc(a, b) {
            return b - a;
        }

        // Returns the supplied default for an undefined value.
        function defaultIfUndefined(val, def) {
            return typeof val === 'undefined' ? def : val;
        }

        // Takes a hash of values against their frequency and returns the most frequently occurring values.
        function calculateModes(frequencyHash, countLimit, transform) {
            var values = [], most = 0, results = [], i;

            transform = transform || function (x) {
                return x;
            };

            // create an array of the counts
            Object.keys(frequencyHash).forEach(function (key) {
                var value = frequencyHash[key];
                values.push(value);
                most = (value > most ? value : most);
            });

            // sort by descending popularity
            values.sort(desc);

            // look up the values for the most popular counts
            for (i = 0; i < countLimit; i++) {
                var count = values[i];
                var modes = [];
                Object.keys(frequencyHash).forEach(function (key) {
                    if (frequencyHash[key] === count) {
                        modes.push(transform(key));
                    }
                });
                results.push({
                    values: modes,
                    count: count
                });
            }

            return results;
        }

        // Scans the image to work out the most likely no. of bgColorCount candidates for the background color.
        function getBackgroundColors(bytes, bgColorCount) {
            var frequencyHash = {};
            var result, i, pixel, modes;

            // get the counts of each unique color
            for (i = 0; i < bytes.length; i += (4 * bgColorSampleRatio)) {
                pixel = getPixelAtOffset(bytes, i);
                if (frequencyHash[pixel.decimal]) {
                    frequencyHash[pixel.decimal]++;
                } else {
                    frequencyHash[pixel.decimal] = 1;
                }
            }

            function transform(x) {
                return toPixel(Number(x));
            }

            function map(mode) {
                return mode.values;
            }

            modes = calculateModes(frequencyHash, bgColorCount, transform)
                .map(map);

            // flatten the modes into a single array, and truncate if necessary
            result = [].concat.apply([], modes)
                .slice(0, bgColorCount);
            return result;
        }

        // Given a coordinate, works towards the edges in each direction, looking for the first
        // pixel that is considered a background color.  This is assumed to represent a bound.
        function getCroppingBoundFromPosition(imageData, bgColors, x, y) {
            var bgHash = {},
                minX, minY, maxX, maxY, width;

            // for efficiency, create a hash of our background pixel values
            bgColors.forEach(function (c) {
                bgHash[c.decimal] = true;
            });

            function isBgColor(x, y) {
                var pixel = getPixelAt(imageData, x, y);
                return typeof bgHash[pixel.decimal] !== 'undefined';
            }

            // if this pixel is a background color then ignore it
            if (isBgColor(x, y)) {
                return null;
            }

            // work from our sample pixel...

            // ... to the left
            for (minX = x; minX > 0; minX--) {
                if (isBgColor(minX - 1, y)) {
                    break;
                }
            }
            if (minX > 0) {
                minX += antiAliasFiddle;
            }

            // ... to the right
            for (maxX = x; maxX < (imageData.width - 1); maxX++) {
                if (isBgColor(maxX + 1, y)) {
                    break;
                }
            }
            if (maxX < (imageData.width - 1)) {
                maxX -= antiAliasFiddle;
            }

            // ... to the top
            for (minY = y; minY > 0; minY--) {
                if (isBgColor(x, minY - 1)) {
                    break;
                }
            }
            if (minY > 0) {
                minY += antiAliasFiddle;
            }

            // ... and finally to the bottom
            for (maxY = y; maxY < (imageData.height - 1); maxY++) {
                if (isBgColor(x, maxY + 1)) {
                    break;
                }
            }
            if (maxY < (imageData.height - 1)) {
                maxY -= antiAliasFiddle;
            }

            return {
                minX: minX,
                minY: minY,
                maxX: maxX,
                maxY: maxY
            };
        }

        // Given a length and the desired number of samples, returns an array of evenly
        // spaced coordinates along the length, ignoring any padding.
        function getSampleCoords(length, sampleCount, padding) {
            var start = padding * length;
            var end = (1 - padding) * length;
            var increment = (end - start) / (sampleCount - 1);
            var coord, coords = [];

            for (coord = start; coord <= end; coord += increment) {
                coords.push(Math.floor(coord));
            }

            return coords;
        }

        // Attempts to automatically determine the cropping bounds of an image, using the specified
        // background color(s) and number of samples.
        function getCroppingBound(imageData, bgColors) {
            var bounds = [];
            var result = {};
            var xs = getSampleCoords(imageData.width, boundsDetectionSampleCount, boundsDetectionPaddingFraction);
            var ys = getSampleCoords(imageData.height, boundsDetectionSampleCount, boundsDetectionPaddingFraction);

            // for each of the coords just calculated, sample potential cropping bounds
            xs.forEach(function (x) {
                ys.forEach(function (y) {
                    var bound = getCroppingBoundFromPosition(imageData, bgColors, x, y);
                    if (bound !== null) {
                        bounds.push(bound);
                    }
                });
            });

            // from the potentials calculated above, work out the most frequently occurring
            // bound for minX, minY, maxX and maxY
            ['min', 'max'].forEach(function (limit) {
                ['X', 'Y'].forEach(function (dimension) {

                    // build frequency hash of our potential bounds
                    var key = limit + dimension,
                        frequencyHash = {},
                        modes;
                    // create a hash of the counts of each potential bound
                    bounds.forEach(function (bound) {
                        var value = bound[key];
                        if (frequencyHash[value]) {
                            frequencyHash[value]++;
                        } else {
                            frequencyHash[value] = 1;
                        }
                    });

                    // calculate the most frequently occurring bound
                    modes = calculateModes(frequencyHash, 1, Number)[0].values;
                    // when there is a tie use either the furthest up or left for min,
                    // or the further down or right for max
                    modes.sort(limit === 'min' ? asc : desc);
                    result[key] = modes[0];
                    
                    // there is probably a more elegant way of expressing the above
                });
            });

            return result;
        }

        var bgColors = getBackgroundColors(imageData.data, bgColorCount);
        var bound = getCroppingBound(imageData, bgColors);

        // if we couldn't calculate one of the bounds for some reason (eg. image is too
        // small to do anything with) then just return the image at its original size
        bound.minX = defaultIfUndefined(bound.minX, 0);
        bound.minY = defaultIfUndefined(bound.minY, 0);
        bound.maxX = defaultIfUndefined(bound.maxX, imageData.width - 1);
        bound.maxY = defaultIfUndefined(bound.maxY, imageData.height - 1);
        // this feels all wrong!
        return bound;
    };
    
    // Draws the given HTML Image element onto a new canvas and returns the canvas.
    this.getImageData = function (imageElem) {
        var canvas = document.createElement('canvas');
        canvas.height = imageElem.height;
        canvas.width = imageElem.width;
        var context = canvas.getContext('2d');
        context.drawImage(imageElem, 0, 0);
        return context.getImageData(0, 0, imageElem.width, imageElem.height)
    };

    // Draws a (cropped) bounded region from the given Image element onto a new canvas and returns the canvas.
    this.cropToCanvas = function (imageElem, bound) {
        var croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = bound.maxX - bound.minX + 1;
        croppedCanvas.height = bound.maxY - bound.minY + 1;
        croppedCanvas.getContext('2d').drawImage(
            imageElem,
            bound.minX,
            bound.minY,
            croppedCanvas.width,
            croppedCanvas.height,
            0,
            0,
            croppedCanvas.width,
            croppedCanvas.height
        );
        return croppedCanvas;
    };
    
};

if (typeof module !== 'undefined') {
    module.exports = MagicCrop;
}
