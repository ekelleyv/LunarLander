'use strict';

Physijs.scripts.worker = 'js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var Game = function() {};

var threexSparks;

Game.prototype.init = function() {

	this.renderer = this.init_renderer();

	this.hud = this.init_hud();

	this.start_time = new Date();

	this.elapsed_time = new Date();

	this.radius = 300;

	this.score = 0;

	this.scene = this.init_scene();

	this.camera = this.init_camera();
	this.camera.h_rotation = 0;
	this.scene.add(this.camera);

	this.lights = this.init_lights();
	for (var i = 0; i < this.lights.length; i++) {
		this.scene.add(this.lights[i]);
	}

	this.lander = new Lander();
	this.lander.mesh.addEventListener( 'collision', this.handle_landing);

	this.scene.add(this.lander.mesh);
	this.scene.add(this.lander.sparks);
	this.scene.add(this.lander.thrust_light);

	window.addEventListener( 'resize', this.onWindowResize.bind(this), false );


	//Creating three ground pieces by hand
	//Do this programmatically
	this.ground = new Ground(0, 600, 600, 100, 100);
	this.scene.add(this.ground.mesh);

	this.ground2 = new Ground(600, 600, 600, 100, 100);
	this.scene.add(this.ground2.mesh);

	this.ground3 = new Ground(-600, 600, 600, 100, 100);
	this.scene.add(this.ground3.mesh);

	this.keyboard = new THREEx.KeyboardState();

	requestAnimationFrame(this.render.bind(this));
	this.scene.simulate();
};

Game.prototype.init_renderer = function() {
	var renderer =  new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.setClearColorHex( 0x111111, 0 );
	renderer.domElement.id = "game";
	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.zIndex   = 0;
	document.body.appendChild(renderer.domElement);
	return renderer;
};

Game.prototype.onWindowResize = function() {
	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );
	this.hud.width = window.innerWidth;
	this.hud.height = window.innerHeight;
};

Game.prototype.init_hud = function() {
	var canvas = document.createElement('canvas');
	canvas.id     = "hud";
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
	canvas.style.zIndex   = 1;
	canvas.style.position = "absolute";

	document.body.appendChild(canvas);

	return canvas;
};

Game.prototype.update_hud = function() {
	var context = this.hud.getContext("2d");
	context.clearRect(0, 0, window.innerWidth, window.innerHeight);
	context.font = "20px BenderLight";
	context.fillStyle = 'white';
	context.textAlign = 'right';

	var score_string = ("0000" + this.score.toString()).slice (-4)
	context.fillText("SCORE", 100, 80);
	context.fillText(score_string, 170, 80);

	context.fillText("TIME", 100, 110);
	context.fillText(this.get_simple_time(), 170, 110);

	context.fillText("FUEL", 100, 140);
	context.fillText(this.lander.fuel, 170, 140);

	this.get_simple_time();

	var vel = this.lander.mesh._physijs.linearVelocity;

	var h_velocity = Math.round(Math.abs(vel.x));
	var v_velocity = Math.round(Math.abs(vel.y));

	var h_string = ("000" + h_velocity.toString()).slice(-3);
	var v_string = ("000" + v_velocity.toString()).slice(-3);

	context.fillText("ALTITUDE", window.innerWidth - 120, 80);
	context.fillText("999", window.innerWidth - 50, 80);

	context.fillText("HORIZONTAL SPEED", window.innerWidth - 120, 110);
	context.fillText(h_string, window.innerWidth - 50, 110);

	context.fillText("VERTICAL SPEED", window.innerWidth - 120, 140);
	context.fillText(v_string, window.innerWidth - 50, 140);
}

Game.prototype.init_scene = function() {
	var scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });
	scene.setGravity(new THREE.Vector3( 0, -9.8, 0 ));
	scene.fog = new THREE.FogExp2( 0x3B3B47, 0.001 );
	return scene;
};

Game.prototype.init_camera = function() {
	var WIDTH = window.innerWidth,
	    HEIGHT = window.innerHeight;

	var VIEW_ANGLE = 45,
	    ASPECT = WIDTH / HEIGHT,
	    NEAR = 0.1,
	    FAR = 10000;
	var camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
                                ASPECT,
                                NEAR,
                                FAR  );
	camera.position.set( 0, 50, this.radius);
	// camera.position.set(0, 0, 100);
	camera.lookAt(new THREE.Vector3(0, 0, 0) );
	return camera;
}

Game.prototype.init_lights = function() {
	var lights = [];
	// Light
	var d_light = new THREE.DirectionalLight( 0xFFFFFF );
	d_light.position.set( 300, 200, 300 );
	d_light.intensity = .7;
	d_light.target.position.set(0, 0, 0);
	d_light.castShadow = true;
	d_light.shadowBias = -.0001
	d_light.shadowMapWidth = d_light.shadowMapHeight = 2048;
	d_light.shadowDarkness = .7;
	
	lights.push(d_light);

	var s_light = new THREE.SpotLight( 0xFFFFFF);
	s_light.position.set( 0, 400, 200 );
	s_light.target.position.copy( this.scene.position );
	s_light.castShadow = true;
	s_light.intensity = .8;
	s_light.shadowDarkness = .7;

	lights.push(s_light);
	return lights;
};

Game.prototype.render = function() {
	this.update_time();
	this.scene.simulate();
	this.lander.update_sparks();
	this.handle_keys();
	this.update_camera();
	this.update_hud();
	requestAnimationFrame( this.render.bind(this) );
	this.renderer.render( this.scene, this.camera );
};

Game.prototype.update_time = function() {
	var current_time = new Date();
	this.elapsed_time = current_time - this.start_time;
};

Game.prototype.get_simple_time = function() {
	var elapsed = this.elapsed_time;
	elapsed /= 1000;
	var seconds = Math.round(elapsed % 60);

	elapsed = Math.floor(elapsed / 60);
	var minutes = Math.round(elapsed % 60);

	var simple_time = ("0" + minutes.toString()).slice (-1) + ":" + ("00" + seconds.toString()).slice (-2) ;
	return simple_time;
}

Game.prototype.handle_keys = function() {
	this.lander.thrust_on = false;
	if (this.keyboard.pressed("w") || this.keyboard.pressed("up")) {
		this.lander.thrust_on = true;
		this.lander.apply_thrust();
		
	}
	if (this.keyboard.pressed("s") || this.keyboard.pressed("down")) {
		
	}
	if (this.keyboard.pressed("a") || this.keyboard.pressed("left")) {
		this.lander.rotate_left();
	}
	if (this.keyboard.pressed("d") || this.keyboard.pressed("right")) {
		this.lander.rotate_right();
	}
};

Game.prototype.handle_landing = function(other_object, relative_velocity, relative_rotation) {
	console.log(this);
}

Game.prototype.update_camera = function() {
	this.camera.position.x = this.lander.mesh.position.x;
	this.camera.position.y = 100;
	this.camera.position.z = Math.max(2*this.lander.mesh.position.y + 50, 50);

	this.camera.lookAt(this.lander.mesh.position);
};

var game = new Game();
window.addEventListener("load", game.init.bind(game));