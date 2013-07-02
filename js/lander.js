var Lander = function() {
	// this.material = this.initMaterial();
	// this.geometry = this.initGeometry();
	this.mesh = this.init_mesh();
	this.sparks = this.init_sparks();
	this.thrust_light = new THREE.SpotLight(0xFF7C00);
	this.thrust_light.distance = 200;
	this.thrust_on = false;

	this.fuel = 1000;
}

Lander.prototype.init_sparks = function() {
	var circle_size = 30;
	var sparks = new THREE.Particles({
                            size: circle_size,
                            count: 300,
                            position: new THREE.Vector3(0,0,0),
                            color: "orange",
                            program: function(context){
	                           	var width = circle_size;
	                           	var height = circle_size;
	                           	var size = circle_size;
								var gradient	= context.createRadialGradient( width/2, height /2, 0, width /2, height /2, width /2 );				
								gradient.addColorStop( 0  , 'rgba(255,255,255,1)' );
								gradient.addColorStop( 0.2, 'rgba(255,255,255,.4)' );
								gradient.addColorStop( 0.4, 'rgba(128,128,128,.1)' );
								gradient.addColorStop( 1  , 'rgba(0,0,0,0)' );

								// gradient.addColorStop( 0  , 'rgba(0, 0, 255,1)' );
								// gradient.addColorStop( 0.2, 'rgba(0, 0, 255,.4)' );
								// gradient.addColorStop( 0.4, 'rgba(0, 0, 128,.1)' );
								// gradient.addColorStop( 1  , 'rgba(0, 0, 0,0)' );

								context.beginPath();
								context.arc(size/2, size/2, size/2, 0, Math.PI*2, false);
								context.closePath();

								context.fillStyle = gradient;
								context.fill();
                            },
                            sparksInit: function(emitter, SPARKS){

                                emitter.addInitializer(new SPARKS.Position( new SPARKS.PointZone( new THREE.Vector3(0,0,0) ) ) );
                                emitter.addInitializer(new SPARKS.Lifetime(0,0.15));
								emitter.addInitializer(new SPARKS.Velocity(new SPARKS.PointZone(new THREE.Vector3(0, -100, 0))));

								emitter.addAction(new SPARKS.Age());
								emitter.addAction(new SPARKS.Move());
								emitter.addAction(new SPARKS.RandomDrift(1000,0,1000));
								emitter.addAction(new SPARKS.Accelerate(0,-100,0));
                            }
                          });
	return sparks;
};

Lander.prototype.init_material = function() {
	var material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial(),
		.8, // high friction
		.4 // low restitution
	);
	material.color.setRGB( .8, .8, .8);
	return material;
};

Lander.prototype.init_geometry = function() {
	var geometry = new THREE.CubeGeometry(4.3, 4.1, 5.5);
	return geometry;
};

Lander.prototype.init_mesh = function() {
	var top_material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial({ color: new THREE.Color(0xFFFFFF)}),
		.8, // high friction
		.4 // low restitution
	);

	top_material.shading = THREE.FlatShading;
	// material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
	// material.map.repeat.set( .05, .05 );

	var bottom_material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial({ color: new THREE.Color(0xCF8100)}),
		.8, // high friction
		.4 // low restitution
	);
	bottom_material.shading = THREE.FlatShading;

	var thruster_material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial({ color: new THREE.Color(0x111111)}),
		.8, // high friction
		.4 // low restitution
	);

	var lander = new Physijs.CylinderMesh(
		// CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded)
		new THREE.CylinderGeometry(5, 5, 3, 8, 10, false),
		bottom_material,
		100
		);
	lander.castShadow = true;
	lander.receiveShadow = true;

	lander.position.z = 30;
	lander.position.y = 250;

	

	var _object;
	var top = new Physijs.CylinderMesh(
		
		new THREE.IcosahedronGeometry(5, .3),
		top_material,
		100
		);

	top.position.y = 3;
	top.castShadow = true;
	top.receiveShadow = true;
	lander.add(top);


	var r_leg = new Physijs.BoxMesh(
		
		new THREE.CubeGeometry(.5, 10, .5, 1, 1, 1),
		top_material,
		10
	);

	r_leg.position.x = 3.5;
	r_leg.position.y = 1;
	r_leg.rotation.z = .3;
	r_leg.castShadow = true;
	r_leg.receiveShadow = true;
	lander.add(r_leg);

	var l_leg = new Physijs.BoxMesh(
		
		new THREE.CubeGeometry(.5, 10, .5, 1, 1, 1),
		top_material,
		10
	);

	l_leg.position.x = -3.5;
	l_leg.position.y = 1;
	l_leg.rotation.z = -.3;
	l_leg.castShadow = true;
	l_leg.receiveShadow = true;
	lander.add(l_leg);

	var f_leg = new Physijs.BoxMesh(
		
		new THREE.CubeGeometry(.5, 10, .5, 1, 1, 1),
		top_material,
		10
	);

	f_leg.position.z = 3.5;
	f_leg.position.y = 1;
	f_leg.rotation.x = -.3;
	f_leg.castShadow = true;
	f_leg.receiveShadow = true;
	lander.add(f_leg);

	var f_leg = new Physijs.BoxMesh(
		
		new THREE.CubeGeometry(.5, 10, .5, 1, 1, 1),
		top_material,
		10
	);

	f_leg.position.z = -3.5;
	f_leg.position.y = 1;
	f_leg.rotation.x = .3;
	f_leg.castShadow = true;
	f_leg.receiveShadow = true;
	lander.add(f_leg);

	var thruster = new Physijs.CylinderMesh(
		new THREE.CylinderGeometry(.5, 2, 3, 30, 10, false),
		thruster_material,
		10
	);

	thruster.position.y = -1;
	thruster.castShadow = true;
	thruster.receiveShadow = true;
	lander.add(thruster);



	return lander;
}

Lander.prototype.apply_thrust = function() {
	var strength = 2000;
	var rotation_matrix = new THREE.Matrix4();
	rotation_matrix.extractRotation(this.mesh.matrix);

	var force_vector = new THREE.Vector4(0, strength, 0, 1);
	force_vector.applyMatrix4(rotation_matrix);
	this.mesh.applyCentralForce(force_vector);

	this.fuel = Math.max(this.fuel - 1, 0);
}

Lander.prototype.rotate_left = function() {
	this.apply_rotation(.1);
}

Lander.prototype.rotate_right = function() {
	this.apply_rotation(-.1);
}

Lander.prototype.apply_rotation = function(amount) {
	var old_vector = this.mesh.getAngularVelocity();
	var rot_vector = new THREE.Vector3(0, 0, amount);
	var new_vector = new THREE.Vector3();
	new_vector.addVectors(old_vector, rot_vector);
	this.mesh.setAngularVelocity(new_vector);
}

Lander.prototype.update_sparks = function() {
	this.sparks.position = this.mesh.position;
	this.sparks.rotation.z = this.mesh.rotation.z;

	this.thrust_light.position = this.sparks.position;

	var rotation_matrix = new THREE.Matrix4();
	rotation_matrix.extractRotation(this.mesh.matrix);
	var offset = new THREE.Vector4(0, -10, 0);
	offset.applyMatrix4(rotation_matrix);

	this.thrust_light.target.position = offset;
	this.thrust_light.target.position.addVectors(this.mesh.position, offset);
	// console.log(this.thrust_light.target.position);

	this.sparks.visible = this.thrust_on;
	this.thrust_light.visible = this.thrust_on;
}