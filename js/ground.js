var Ground = function(offset, width, depth, start_height, end_height) {
	this.start_height = start_height;
	this.end_height = end_height;

	this.width = width;
	this.depth = depth;

	this.width_segments = this.width/6;
	this.height_segments = this.depth/6;

	this.offset = offset;

	//Parameters
	this.max_prominence = 200;
	this.min_height = 20;
	this.num_spots = 10;
	this.min_spot_width = 10;
	this.max_spot_width = 30;
	this.inter_spot_noise = 3;
	// this.inter_spot_noise = 0;


	this.material = this.init_material();
	this.geometry = this.init_geometry();
	this.mesh = this.init_mesh();
}

Ground.prototype.init_material = function() {
	var material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/dirt.png' ) }),
		.8, // high friction
		.3 // low restitution
	);

	material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
	material.map.repeat.set( 6 , 6 );

	return material;
};

Ground.prototype.init_geometry = function() {
	var geometry = new THREE.PlaneGeometry( this.width, this.depth, this.width_segments, this.height_segments );

	var width_size = geometry.widthSegments+1;
	var height_size = geometry.heightSegments+1;

	//Generate the landing spot locations
	var spots = [];
	var range_size = this.width/this.num_spots - this.max_spot_width;
	for (var i = 0; i < this.num_spots; i++) {
		var spot = {};
		var spot_width = Math.max(Math.random()*this.max_spot_width, this.min_spot_width);


		//Endpoints for current window for generating landing spots
		var low_range = i/this.num_spots*this.width - this.width/2;
		var upper_range = low_range + range_size;

		spot.x = range_size*Math.random() + low_range;
		spot.y = Math.random()*this.max_prominence + this.min_height;
		spot.width = spot_width;
		spots.push(spot);
	}

	//Generate the terrain
	var terrain_height = this.start_height;
	var end_terrain_height = this.end_height;
	var spot_count = 0;
	var index = 0;
	for ( var i = 0; i < height_size; i++ ) {
		//TODO: FIX THE DIRECTION OF Y
		//Because the mesh has been rotated, y is x
		var x_pos = -1*geometry.vertices[index].y;
		var spot = spots[spot_count];

		//past_start : past the starting point of a landing spot
		//past_end : past the end point of a landing spot
		//If within a spot, terrain is flat
		//If outside of a spot, move along the slope between the spots (with noise)
		var past_start = (x_pos > spot.x);
		var past_end = (x_pos > (spot.x + spot.width));


		//If moving to next landing spot
		if (!past_start) {
			//The target height is the height of the next spot
			var prev_height;
			var target_height = spot.y;

			var prev_x;
			var target_x = spot.x;

			//If between the start and the first landing spot
			if (spot_count == 0) {
				// prev_x = -this.width/2;
				// prev_height = terrain_height;
				terrain_height = this.start_height;
			}
			//If between any other two spots
			else {
				prev_x = spots[spot_count-1].x + spots[spot_count-1].width;
				prev_height = spots[spot_count-1].y;

				//Calculate the terrain height based on position between spots
				terrain_height = (x_pos-prev_x)/(target_x-prev_x)*(target_height-prev_height) + prev_height;
				
				//Add noise to the inter-spot slope
				terrain_height += (Math.random()-.5)*this.inter_spot_noise;
			}


		}
		//If within the spot, make the terrain flat
		else if (past_start && !past_end) {
			terrain_height = spot.y;
		}
		//Move to the next spot
		else {
			//Next spot
			if (spot_count < spots.length-1) {
				past_start = false;
				past_end = false;
				spot_count++;
			}
			//Between last spot and end
			else {
				terrain_height = this.end_height;
				// var prev_x = spots[spots.length-1].x + spots[spots.length-1].width;
				// var prev_height = spots[spots.length-1].y;
				// terrain_height = (x_pos-prev_x)/(this.end_height-prev_x)*(this.end_height-prev_height) + prev_height;
			}
		}

		//Generate height based on the depth position
		//TODO: Get rid of the magic numbers
		for (var j = 0; j < width_size; j++) {
			index = j + i*width_size;
			var depth = geometry.vertices[index].x;

			//Logistic function
			var exp = -.1*(depth+80);
			var height = terrain_height/(1+Math.pow(Math.E, exp));

			//If after the landing depth, set to zero
			if (depth > 20 && depth < 150) {
				height = 0;
			}
			//For the background "mountain."
			//TODO: Replace with something more interesting
			else if (depth >= 150) {
				height = depth - 150 + (Math.random()-.5)*10;
			}

			var noise = (past_start && !past_end) ? 0 : (Math.random()-.5)*this.inter_spot_noise;
			geometry.vertices[index].z = height + noise;
		}
	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	return geometry;
};

Ground.prototype.init_mesh = function() {
	var mesh = new Physijs.HeightfieldMesh(
		this.geometry,
		this.material,
		0, // mass
		this.geometry.widthSegments,
		this.geometry.heightSegments
	);

	mesh.rotation.set(-Math.PI/2, 0, Math.PI/2);
	mesh.position.set(this.offset, 0, 0);
	mesh.receiveShadow = true;
	mesh.castShadow = true;

	return mesh;
}

