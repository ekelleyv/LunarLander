var Lander = function() {
	this.material = this.initMaterial();
	this.geometry = this.initGeometry();
	this.mesh = this.initMesh();
	this.sparks = this.initSparks();
}

Lander.prototype.initSparks = function() {
	var threexSparks = new THREEx.Sparks({
		maxParticles : 400,
		counter : new SPARKS.SteadyCounter(300)
	})

	var emitter = threexSparks.emitter();

	var initColorSize	= function(){
		this.initialize = function( emitter, particle ){
			particle.target.color().setRGB(.9, .4, .1)
			particle.target.size(150);
		};
	};


	emitter.addInitializer(new initColorSize());
	emitter.addInitializer(new SPARKS.Position( new SPARKS.PointZone( new THREE.Vector3(0,200,0) ) ) );
	emitter.addInitializer(new SPARKS.Lifetime(0,.1));
	emitter.addInitializer(new SPARKS.Velocity(new SPARKS.PointZone(new THREE.Vector3(0,50,00))));

	emitter.addAction(new SPARKS.Age());
	emitter.addAction(new SPARKS.Move());
	emitter.addAction(new SPARKS.RandomDrift(1000,0,1000));
	emitter.addAction(new SPARKS.Accelerate(0,-10,0));

	return threexSparks;
};

Lander.prototype.initMaterial = function() {
	var material = Physijs.createMaterial(
		new THREE.MeshLambertMaterial(),
		.8, // high friction
		.4 // low restitution
	);
	material.color.setRGB( .8, .8, .8);
	return material;
};

Lander.prototype.initGeometry = function() {
	var geometry = new THREE.CubeGeometry(4.3, 4.1, 5.5);
	return geometry;
};

Lander.prototype.initMesh = function() {
	var mesh = new Physijs.BoxMesh(
		this.geometry,
		this.material,
		50 // mass
	);

	mesh.position.set(5, 150, 0);
	mesh.receiveShadow = true;

	return mesh;
}

Lander.prototype.apply_thrust = function() {
	var strength = 1000;
	var rotation_matrix = new THREE.Matrix4();
	rotation_matrix.extractRotation(this.mesh.matrix);

	var force_vector = new THREE.Vector3(0, strength, 0);
	var final_force_vector = rotation_matrix.multiplyVector3(force_vector);
	this.mesh.applyCentralForce(final_force_vector);
}

Lander.prototype.rotate_left = function() {
	this.apply_rotation(.05);
}

Lander.prototype.rotate_right = function() {
	this.apply_rotation(-.05);
}

Lander.prototype.apply_rotation = function(amount) {
	var old_vector = this.mesh.getAngularVelocity();
	var rot_vector = new THREE.Vector3(0, 0, amount);
	var new_vector = new THREE.Vector3();
	new_vector.addVectors(old_vector, rot_vector);
	this.mesh.setAngularVelocity(new_vector);
}