describe('canvas utilities', function () {

    describe('getImageData', function () {

        it('should be defined', function () {
            var magicCrop = new MagicCrop();
            
            expect(magicCrop.getImageData).to.be.a('Function');
        });

        it('should get the ImageData from an Image element', function () {
            var magicCrop = new MagicCrop();
            var image = new Image();
            image.src = window.testImages.singleColor;

            var imageData = magicCrop.getImageData(image);

            expect(imageData.width).to.equal(250);
            expect(imageData.height).to.equal(250);
        });
    });

    describe('cropToCanvas', function () {

        it('should be defined', function () {
            var magicCrop = new MagicCrop();

            expect(magicCrop.cropToCanvas).to.be.a('Function');
        });

        it('should draw a cropped canvas from an Image element', function () {
            var magicCrop = new MagicCrop();
            var image = new Image();
            image.src = window.testImages.singleColor;
            var bound = {
                minX: 10,
                minY: 10,
                maxX: 20,
                maxY: 20
            };

            var canvas = magicCrop.cropToCanvas(image, bound);

            expect(canvas.width).to.equal(11);
            expect(canvas.height).to.equal(11);
        });

        it('should crop a single pixel', function () {
            var magicCrop = new MagicCrop();
            var image = new Image();
            image.src = window.testImages.singleColor;
            var bound = {
                minX: 0,
                minY: 0,
                maxX: 0,
                maxY: 0
            };

            var canvas = magicCrop.cropToCanvas(image, bound);

            expect(canvas.width).to.equal(1);
            expect(canvas.height).to.equal(1);
        });
    })

});