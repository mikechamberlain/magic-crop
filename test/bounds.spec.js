describe('calcCroppingBounds', function () {

    it('should be defined', function () {
        var magicCrop = new MagicCrop();

        expect(magicCrop.calcCroppingBounds).to.be.a('Function');
    });

    it('should throw on an empty image', function () {
        var magicCrop = new MagicCrop();

        function f() {
            magicCrop.calcCroppingBounds([], 1, 1);
        }

        expect(f).to.throw('Empty image');
    });

    it('should throw when supplied dimensions are not consistent with image bytes', function () {
        var magicCrop = new MagicCrop();
        var imageBytes = [
            0, 0, 0, 0,
            0, 0, 0, 0
        ];

        function f() {
            // image has 2 pixels but we are claiming only 1
            magicCrop.calcCroppingBounds(imageBytes, 1, 1);
        }
        
        expect(f).to.throw('Inconsistent');
    });
    
    it('should detect bounds for image of a single pixel', function () {
        var magicCrop = new MagicCrop();
        var imageBytes = [0, 0, 0, 0];

        var bound = magicCrop.calcCroppingBounds(imageBytes, 1, 1);
        
        expect(bound.minX).to.equal(0);
        expect(bound.minY).to.equal(0);
        expect(bound.maxX).to.equal(0);
        expect(bound.maxY).to.equal(0);
    });

    it('should detect bounds for image of single color', function () {
        var magicCrop = new MagicCrop();
        var image = new Image();
        image.src = testImages.singleColor;
        var imageData = magicCrop.getImageData(image);

        var bound = magicCrop.calcCroppingBounds(imageData.data.buffer, image.width, image.height);

        expect(bound.minX).to.equal(0);
        expect(bound.minY).to.equal(0);
        expect(bound.maxX).to.equal(image.width - 1);
        expect(bound.maxY).to.equal(image.height - 1);
    });

    it('should detect bounds for image with borders on top and bottom', function () {
        var magicCrop = new MagicCrop();
        var image = new Image();
        image.src = testImages.horizontalStripe;
        var imageData = magicCrop.getImageData(image);

        var bound = magicCrop.calcCroppingBounds(imageData.data.buffer, image.width, image.height);

        expect(bound.minX).to.equal(0);
        expect(bound.minY).to.equal(32);
        expect(bound.maxX).to.equal(image.width - 1);
        expect(bound.maxY).to.equal(220);
    });

    it('should detect bounds for image with borders on sides', function () {
        var magicCrop = new MagicCrop();
        var image = new Image();
        image.src = testImages.verticalStripe;
        var imageData = magicCrop.getImageData(image);

        var bound = magicCrop.calcCroppingBounds(imageData.data.buffer, image.width, image.height);

        expect(bound.minX).to.equal(24);
        expect(bound.minY).to.equal(0);
        expect(bound.maxX).to.equal(226);
        expect(bound.maxY).to.equal(image.height - 1);
    });

    it('should detect bounds for image borders all around', function () {
        var magicCrop = new MagicCrop();
        var image = new Image();
        image.src = testImages.bordered;
        var imageData = magicCrop.getImageData(image);

        var bound = magicCrop.calcCroppingBounds(imageData.data.buffer, image.width, image.height);

        expect(bound.minX).to.equal(25);
        expect(bound.minY).to.equal(51);
        expect(bound.maxX).to.equal(218);
        expect(bound.maxY).to.equal(194);
    });

    it('should detect bounds for a real screenshot', function () {
        var magicCrop = new MagicCrop();
        var image = new Image();
        image.src = testImages.guardian;
        var imageData = magicCrop.getImageData(image);

        var bound = magicCrop.calcCroppingBounds(imageData.data.buffer, image.width, image.height);

        expect(bound.minX).to.equal(26);
        expect(bound.minY).to.equal(493);
        expect(bound.maxX).to.equal(613);
        expect(bound.maxY).to.equal(856);
    });
});