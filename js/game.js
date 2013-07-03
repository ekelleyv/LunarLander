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

	this.landing_time;

	this.radius = 300;

	this.score = 0;

	this.landed = false;

	this.landing_type = 0;

	this.paused = true;
	this.message = "";
	this.game_status = "";

	this.scene = this.init_scene();

	this.camera = this.init_camera();
	this.camera.h_rotation = 0;
	this.scene.add(this.camera);

	this.lights = this.init_lights();
	for (var i = 0; i < this.lights.length; i++) {
		this.scene.add(this.lights[i]);
	}

	this.lander = new Lander();
	this.lander.mesh.addEventListener( 'collision', this.handle_landing.bind(this));

	this.scene.add(this.lander.mesh);
	this.scene.add(this.lander.thrust);
	this.scene.add(this.lander.thrust_light);
	this.scene.add(this.lander.flames);
	console.log(this.lander.flames);

	window.addEventListener( 'resize', this.onWindowResize.bind(this), false );


	//Creating three ground pieces by hand
	//Do this programmatically
	this.terrain = new Terrain();
	this.terrain.init(this.scene);
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
	var altitude = Math.round(this.lander.mesh.position.y);

	var h_string = ("000" + h_velocity.toString()).slice(-3);
	var v_string = ("000" + v_velocity.toString()).slice(-3);
	var a_string = ("000" + altitude.toString()).slice(-3);

	context.fillText("ALTITUDE", window.innerWidth - 120, 80);
	context.fillText(a_string, window.innerWidth - 50, 80);

	context.fillText("HORIZONTAL SPEED", window.innerWidth - 120, 110);
	context.fillText(h_string, window.innerWidth - 50, 110);

	context.fillText("VERTICAL SPEED", window.innerWidth - 120, 140);
	context.fillText(v_string, window.innerWidth - 50, 140);

	context.font = "24px BenderLight";
	context.textAlign = 'center';

	context.fillText(this.message, window.innerWidth/2, window.innerHeight/2+100);
	context.fillText(this.game_status, window.innerWidth/2, window.innerHeight/2+130);
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

Game.prototype.handle_reset = function() {
	if (this.landed) {
		var current_time = new Date();
		if (current_time - this.landing_time > 3000) {
			// this.lander.mesh.position.set(0, 250, 0);
			// this.lander.mesh.rotation.set(0, 0, 0);
			// this.lander.mesh._physijs.linearVelocity.set(0, 0, 0);
			// this.lander.mesh._physijs.angularVelocity.set(0, 0, 0);
			// this.lander.mesh.__dirtyPosition = true;
			// this.lander.mesh.__dirtyRotation = true;
			console.log(this.lander.mesh);
			this.landed = false;
			//Perfect
			if (this.landing_type == 0) {

			}
			//Hard
			else if (this.landing_type == 1) {

			}
			//Catastrophic 
			else {

			}
		}
	}
}

Game.prototype.render = function() {
	this.update_time();
	this.scene.simulate();
	this.lander.update_thrust();
	this.lander.update_flames();
	this.handle_keys();
	this.handle_reset();
	this.update_camera();
	this.terrain.update(this.scene, this.camera.position);
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
		
		if (!this.landed && this.lander.fuel > 0) {
			this.lander.thrust_on = true;
			this.lander.apply_thrust();
		}
		
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
	var vel = relative_velocity.length();

	if (!this.landed) {
		if (vel > 10) {
			this.message = "CATASTROPHIC FAILURE";
			this.game_status = "GAME OVER";
			this.landing_type = 2;
			this.lander.flames_on = true;
		}
		else if (vel > 6) {
			this.message = "HARD LANDING: 50PTS";
			this.game_status = "GAME OVER";
			this.score += 50;
			this.landing_type = 1;
		}
		else {
			this.message = "PERFECT LANDING: 100PTS";
			this.score += 100;
			this.landing_type = 0;
		}
	this.landing_time = new Date();
	this.landed = true;
	}
}

Game.prototype.update_camera = function() {
	this.camera.position.x = this.lander.mesh.position.x;
	this.camera.position.y = 100;
	this.camera.position.z = Math.min(Math.max(2*this.lander.mesh.position.y + 50, 50), 1000);

	this.camera.lookAt(this.lander.mesh.position);
};

var game = new Game();
window.addEventListener("load", game.init.bind(game));