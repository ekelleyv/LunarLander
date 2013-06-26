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

var radius = 100;

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

    this.scene.setGravity(new THREE.Vector3(0, -1.622*4, 0));

	this.camera.position.y = 50;
	this.camera.position.z = radius;

	// Game.camera.lookAt(new THREE.Vector3(0, 0, 0));
	this.scene.add(Game.camera);

	this.renderer.setSize(WIDTH, HEIGHT);

	document.body.appendChild(this.renderer.domElement);

	// var loader = new THREE.ColladaLoader();

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
	lander.thrust_force = 44400*4; //N
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

	lander.mesh.position.set(0, 10, 0);


	lander.mesh.addEventListener("collision", Game.handle_landing.bind(Game));

	Game.scene.add(lander.mesh);

    Game.build_terrain();

	// ground.mesh = new Physijs.PlaneMesh(
 //        ground.geometry,
 //        ground.material,
 //        0,
 //        { restitution: .2, friction: .8 }
 //    );


	light = new THREE.SpotLight( 0xFFFFFF );
	light.position.set( 0, 200, 400 );
	light.target.position.copy( this.scene.position );
	light.castShadow = true;
	light.shadowDarkness = .7;
	// light.shadowCameraVisible = true;
	Game.scene.add(light);
};

Game.build_terrain = function() {
	ground = Game.items.ground;

	ground.material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial(({ map: THREE.ImageUtils.loadTexture( 'dirt.png'), wireframe: true })),
        .2,
        .9
    );

    ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
    ground.material.map.repeat.set( 4, 4);

	ground.geometry = new THREE.PlaneGeometry( 600, 600, 100, 100);

	// var width_size = ground.geometry.widthSegments+1;
	// var height_size = ground.geometry.heightSegments+1;

	// var last_height = 30;
	// var landing_width = 10;
	// var terrain_height = 0;
	// for ( var i = 0; i < height_size; i++ ) {
	// 	if (i%landing_width == 0) {
	// 		terrain_height = Math.max(last_height + (Math.random()-.5)*20, 0);//(width_size - i) - 3;
	// 		last_height = terrain_height;
	// 	}
	// 	for (var j = 0; j < width_size; j++) {
	// 		var index = j + i*width_size;
	// 		var depth = ground.geometry.vertices[index].x;
	// 		var exp = -.1*(depth+40);
	// 		// var height = terrain_height/(1+Math.pow(Math.E, exp));
	// 		var height = depth;
	// 		ground.geometry.vertices[index].z = height;
	// 	}
	// }

	for ( var i = 0; i < ground.geometry.vertices.length; i++ ) {
			var vertex = ground.geometry.vertices[i];
			vertex.z = 3 * Math.cos(vertex.y*3);
	}

	ground.geometry.computeFaceNormals();
	ground.geometry.computeVertexNormals();
	ground.geometry.computeBoundingBox();
	

	// If your plane is not square as far as face count then the HeightfieldMesh
	// takes two more arguments at the end: # of x faces and # of y faces that were passed to THREE.PlaneMaterial
	ground.mesh = new Physijs.HeightfieldMesh(
	   ground.geometry,
       ground.material,
       0,
       100,
       100
	);
	console.log(ground);

	ground.mesh.rotation.set(-Math.PI/2, 0, Math.PI/2);
	ground.mesh.receiveShadow = true;
	ground.mesh.castShadow = true;

	Game.scene.add(ground.mesh);
	
}

Game.handle_landing = function(other_object, linear_velocity, angular_velocity) {
	var impact_velocity= linear_velocity.length();
	console.log(impact_velocity)
	if (impact_velocity > 2) {
		console.log("YOU ARE DEAD");
	}
};

Game.render = function() {
	Game.handle_keys();
	// Game.update_camera();
	Game.renderer.render(Game.scene, Game.camera);
};

Game.update_camera = function() {
	// Game.camera.position.x
	var position = Game.items.lander.mesh.position;
	Game.camera.position.x = position.x;

	var height = position.y;
	Game.camera.position.z = Math.max(2*position.y + 50, 100);
}

var h_rotation = 0;
var v_rotation = 0; 
Game.handle_keys = function() {
	var lander = this.items.lander;

	if (this.keyboard.pressed("w")) {
		// this.apply_thrust(lander);
		
	}
	if (this.keyboard.pressed("s")) {
		// this.apply_thrust(lander);
	}
	if (this.keyboard.pressed("a")) {
		// this.rotate_left(lander);
		h_rotation -= .05;
	}
	if (this.keyboard.pressed("d")) {
		// this.rotate_right(lander);
		h_rotation += .05;
	}

	Game.camera.position.x = radius*Math.sin( h_rotation );         
	Game.camera.position.z = radius*Math.cos( h_rotation );
	Game.camera.lookAt(Game.scene.position);
};

Game.apply_thrust = function(lander) {
	var strength = Game.items.lander.thrust_force;
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
