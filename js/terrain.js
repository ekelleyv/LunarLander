var Terrain = function() {
	this.ground_pieces = [];
	this.init();
}

Terrain.prototype.init = function() {


};

Terrain.prototype.add_to_scene = function(scene) {
	for (var i = 0; i < this.ground_pieces.length; i++) {
		scene.add(this.ground_pieces[i]);
	}
};