describe('cropping bounds', function () {

    it('should be defined', function () {
        expect(window.MagicCrop.calcCroppingBounds).to.be.a('Function');
    });

    it('should throw on an empty image', function () {
        function f() {
            window.MagicCrop.calcCroppingBounds([], 1, 1);
        }
        expect(f).to.throw();
    });

    it('should throw on inconsistent dimensions', function () {
        var imageBytes = [
            0, 0, 0, 0,
            0, 0, 0, 0
        ];
        function f() {
            window.MagicCrop.calcCroppingBounds(imageBytes, 1, 1);
        }
        expect(f).to.throw();
    });
    
    it('should work on a single pixel image', function () {
        var imageBytes = [0, 0, 0, 0];
        var bound = window.MagicCrop.calcCroppingBounds(imageBytes, 1, 1);
        expect(bound.minX).to.equal(0);
        expect(bound.minY).to.equal(0);
        expect(bound.maxX).to.equal(1);
        expect(bound.maxY).to.equal(1);
    });
});