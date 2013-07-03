var Terrain = function() {
	this.ground_pieces = [];
	this.width = 600;
	this.min_x = 0;
	this.max_x = 0;
}

Terrain.prototype.init = function(scene) {
	// offset, width, depth, start_height, end_height
	for (var i = 0; i < 3; i++) {
		var start = (i-1)*this.width;
		if ((start - this.width/2) < this.min_x) {
			this.min_x = start - this.width/2;
		}
		if (start+this.width/2 > this.max_x) {
			this.max_x = start+this.width/2;
		}
		var ground = new Ground(start, this.width, this.width, 100, 100);
		scene.add(ground.mesh);
	}
	console.log(scene);
};

Terrain.prototype.update = function(scene, camera_pos) {
	var threshold = 600;
	var camera_x = camera_pos.x;
	//Create piece on right
	if (camera_x > (this.max_x - threshold)) {
		console.log("adding right");
		var ground = new Ground( this.max_x + this.width/2, this.width, this.width, 100, 100);
		this.max_x += this.width;
		scene.add(ground.mesh);
	}
	//Create piece on left
	else if (camera_x < (this.min_x + threshold)) {
		console.log("adding left");
		var ground = new Ground( this.min_x - this.width/2, this.width, this.width, 100, 100);
		this.min_x -= this.width;
		scene.add(ground.mesh);
	}
}