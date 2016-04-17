describe('module', function () {

    it('should be defined', function () {
        expect(window.MagicCrop).to.be.a('Function');
    });

    it('should instantiate', function () {
        var magicCrop = new MagicCrop();
        expect(magicCrop).to.be.an('Object');
    });
});