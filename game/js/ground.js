var Ground = function() {
	this.material = this.initMaterial();
	this.geometry = this.initGeometry();
	this.mesh = this.initMesh();
}

Ground.prototype.initMaterial = function() {
	var material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/dirt.png' ) }),
		.8, // high friction
		.3 // low restitution
	);

	material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
	material.map.repeat.set( 6 , 6 );

	return material;
};

Ground.prototype.initGeometry = function() {
	var mesh_width = 600;
	var mesh_height = 600;
	var max_height = 100;
	var geometry = new THREE.PlaneGeometry( mesh_width, mesh_height, 100, 100 );

	var width_size = geometry.widthSegments+1;
	var height_size = geometry.heightSegments+1;

	var num_spots = 10;
	var spots = [];
	for (var i = 0; i < num_spots; i++) {
		var spot = {};
		var spot_width = Math.max(Math.random()*30, 10);

		var low_range = i/num_spots*mesh_width - mesh_width/2;
		var upper_range = (i+1)/num_spots*mesh_width - spot_width - mesh_width/2;
		var range_size = upper_range - low_range;

		spot.x = range_size*Math.random() + low_range;
		spot.y = Math.random()*max_height + 40;
		spot.width = spot_width;
		spots.push(spot);
	}

	var last_height = 30;
	var landing_width = 3;
	var terrain_height = Math.random()*max_height;
	var end_terrain_height = Math.random()*max_height;
	var spot_count = 0;
	var index = 0;
	for ( var i = 0; i < height_size; i++ ) {
		var width_pos = -1*geometry.vertices[index].y;
		var spot = spots[spot_count];
		// console.log(spots);
		var past_start = (width_pos > spot.x);
		var past_end = (width_pos > (spot.x + spot.width));
		// console.log(width_pos, spot.x, past_start, past_end);

		if (!past_start) {
			var prev_height = 0;
			var target_height = spot.y;

			var prev_x = 0;
			var target_x = spot.x;
			if (spot_count == 0) {
				prev_x = -mesh_width/2;
				prev_height = terrain_height;
			}
			else {
				prev_x = spots[spot_count-1].x;
				prev_height = spots[spot_count-1].y;
			}

			terrain_height = (width_pos-prev_x)/(target_x-prev_x)*(target_height-prev_height) + prev_height;
			terrain_height += (Math.random()-.5)*3;

		}
		else if (past_start && !past_end) {
			terrain_height = spot.y;
		}
		else {
			//Next spot
			if (spot_count < spots.length-1) {
				past_start = false;
				past_end = false;
				spot_count++;
			}
			else {
				terrain_height = 5;
			}
		}
		for (var j = 0; j < width_size; j++) {
			index = j + i*width_size;
			var depth = geometry.vertices[index].x;
			var exp = -.1*(depth+80);
			var height = terrain_height/(1+Math.pow(Math.E, exp));

			if (depth > 20 && depth < 150) {
				height = 0;
			}
			else if (depth >= 150) {
				height = depth - 150 + (Math.random()-.5)*10;
			}
			// var height = depth;
			var noise = (past_start && !past_end) ? 0 : (Math.random()-.5)*6;
			geometry.vertices[index].z = height + noise;
		}
	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	return geometry;
};

Ground.prototype.initMesh = function() {
	var mesh = new Physijs.HeightfieldMesh(
		this.geometry,
		this.material,
		0, // mass
		100,
		100
	);

	mesh.rotation.set(-Math.PI/2, 0, Math.PI/2);
	mesh.receiveShadow = true;
	mesh.castShadow = true;

	return mesh;
}

