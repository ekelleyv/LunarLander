if ( !window.requestAnimationFrame ) {
  window.requestAnimationFrame = ( function() {
	  return window.webkitRequestAnimationFrame ||
	  window.mozRequestAnimationFrame ||
	  window.oRequestAnimationFrame ||
	  window.msRequestAnimationFrame ||
	  function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
		  window.setTimeout( callback, 1000 / 60 );
	  };
	})();
}

var Game = {};
Game.items = {
	lander: {},
	ground: {},
	light: {}
};
Game.keyboard = new THREEx.KeyboardState();

Game.init = function () {
	// set the scene size
	var WIDTH = window.innerWidth,
	    HEIGHT = window.innerHeight;
	// var WIDTH = 640,
	// 	HEIGHT =480;

	// set some camera attributes
	var VIEW_ANGLE = 45,
	    ASPECT = WIDTH / HEIGHT,
	    NEAR = 0.1,
	    FAR = 10000;


	this.renderer = new THREE.WebGLRenderer({
		antialias: true,
	});

	this.renderer.shadowMapEnabled = true;
	this.renderer.shadowMapSoft = true;

	this.camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
                                ASPECT,
                                NEAR,
                                FAR  );
	this.scene = new Physijs.Scene({ reportsize: 50, fixedTimeStep: 1 / 60 });
    this.scene.setGravity(new THREE.Vector3(0, -1.622, 0));

	this.camera.position.y = 20;
	this.camera.position.z = 100;
	// Game.camera.lookAt(new THREE.Vector3(0, 0, 0));
	this.scene.add(Game.camera);

	this.renderer.setSize(WIDTH, HEIGHT);

	document.body.appendChild(this.renderer.domElement);

	var loader = new THREE.ColladaLoader();

	// loader.load( '../lander_small.dae', function ( collada ) {
	// 	var lander = Game.items.lander;

	// 	lander.dae = collada.scene;
	// 	lander.dae.scale.x = lander.dae.scale.y = lander.dae.scale.z = 0.002;
	// 	lander.dae.updateMatrix();

	// 	Game.init_scene();
	// 	Game.animate();

	// } );

	Game.init_scene();
	Game.animate();
};

Game.init_scene = function() {

	var lander = Game.items.lander;
	var ground = Game.items.ground;
	var light = Game.items.light;

	lander.mass = 14696; //kg
	lander.torque = 1100; //N*m
	lander.thrust_force = 44400; //N
	lander.moment_inertia = 36740; //kg*m^2
	lander.angular_acceleration = lander.torque/lander.moment_inertia;

	//Lander
	lander.material = Physijs.createMaterial(
	  new THREE.MeshLambertMaterial({ color: 0xCC0000 }),
      .8, // high friction
      .4 // low restitution
    )

	lander.geometry= new THREE.CubeGeometry(4.3, 4.1, 5.5);

	lander.mesh = new Physijs.BoxMesh(
        lander.geometry,
        lander.material,
        14696, // mass
        { restitution: .2, friction: .8 }
    );
	// lander.mesh = lander.dae;

	lander.mesh.castShadow = true;

	lander.mesh.position.set(0, 20, 0);
	// lander.mesh.rotation.set(0, 0, Math.PI/4);

	lander.mesh.addEventListener("collision", Game.handle_landing.bind(Game));

	Game.scene.add(lander.mesh);

	//Ground
	ground.geometry = new THREE.CubeGeometry(100, 1, 100);

	// ground.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -100, 0));

	ground.material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ color: 0xEEEEEE }),
        .2,
        .9
    );

	ground.mesh = new Physijs.BoxMesh(
        ground.geometry,
        ground.material,
        0,
        { restitution: .2, friction: .8 }
    );
    
	// ground.mesh.castShadow = true;
	ground.mesh.receiveShadow = true;

	Game.scene.add(ground.mesh);

	light = new THREE.SpotLight( 0xFFFFFF );
	light.position.set( 0, 200, 400 );
	light.target.position.copy( this.scene.position );
	light.castShadow = true;
	light.shadowDarkness = .7;
	// light.shadowCameraVisible = true;
	Game.scene.add(light);
};

Game.handle_landing = function(other_object, linear_velocity, angular_velocity) {
	var impact_velocity= linear_velocity.length();
	console.log(impact_velocity)
	if (impact_velocity > 2) {
		console.log("YOU ARE DEAD");
	}
};

Game.render = function() {
	Game.handle_keys();
	Game.update_camera();
	Game.renderer.render(Game.scene, Game.camera);
};

Game.update_camera = function() {
	// Game.camera.position.x
	var position = Game.items.lander.mesh.position;
	Game.camera.position.x = position.x;

	var height = position.y;
	Game.camera.position.z = Math.max(2*position.y + 50, 50);
}

Game.handle_keys = function() {
	var lander = this.items.lander;

	if (this.keyboard.pressed("w")) {
		this.apply_thrust(lander);
	}
	if (this.keyboard.pressed("a")) {
		this.rotate_left(lander);
	}
	if (this.keyboard.pressed("d")) {
		this.rotate_right(lander);
	}
};

Game.apply_thrust = function(lander) {
	var strength = 44400;
	var rotation_matrix = new THREE.Matrix4();
	rotation_matrix.extractRotation(lander.mesh.matrix);

	var force_vector = new THREE.Vector3(0, strength, 0);
	var final_force_vector = rotation_matrix.multiplyVector3(force_vector);
	Game.items.lander.mesh.applyCentralForce(final_force_vector);


}

Game.rotate_right = function(lander) {
	var old_vector = Game.items.lander.mesh.getAngularVelocity();
	var rot_vector = new THREE.Vector3(0, 0, -.05);
	var new_vector = new THREE.Vector3();
	new_vector.addVectors(old_vector, rot_vector);
	Game.items.lander.mesh.setAngularVelocity(new_vector);
}

Game.rotate_left = function(lander) {
	var old_vector = Game.items.lander.mesh.getAngularVelocity();
	var rot_vector = new THREE.Vector3(0, 0, .05);
	var new_vector = new THREE.Vector3();
	new_vector.addVectors(old_vector, rot_vector);
	Game.items.lander.mesh.setAngularVelocity(new_vector);
}

Game.frameTime = 0; //ms
Game.cumFrameTime = 0; //ms
Game._lastFrameTime = Date.now(); //timestamp

Game.animate = function() {
	var time = Date.now();
	Game.frameTime = time - Game._lastFrameTime;
	Game._lastFrameTime = time;
	Game.cumulatedFrameTime += Game.frameTime;

    Game.scene.simulate();
	Game.render();

	window.requestAnimationFrame(Game.animate);
}


window.addEventListener("load", Game.init.bind(Game));
