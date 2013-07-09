'use strict';

Physijs.scripts.worker = 'js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var Game = function() {};

var threexSparks;

Game.prototype.init = function() {

	this.renderer = this.init_renderer();

	this.hud = this.init_hud();

	this.start_time = new Date();
	this.elapsed_time = 0;
	this.landing_time;
	this.landing_vel;
	this.landing_angle;
	this.assigned_score = false;


	this.radius = 300;
	this.score = 0;
	this.landed = false;
	this.landing_type = 0;
	this.paused = true;
	this.game_started = false;
	this.start_message = "PRESS SPACE TO START"
	this.start_instruction = ""

	this.message = this.start_message;
	this.game_status = this.start_instruction;

	this.render_stats;
	this.init_stats();


	this.scene = this.init_scene();

	this.camera = this.init_camera();

	this.lights = this.init_lights();

	this.lander = new Lander(this.scene);
	this.lander.mesh.addEventListener( 'collision', this.handle_collision.bind(this));


	this.terrain = new Terrain(this.scene);

	this.keyboard = new THREEx.KeyboardState();

	requestAnimationFrame(this.render.bind(this));

	window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
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

Game.prototype.init_stats = function() {
	this.render_stats = new Stats();
	this.render_stats.domElement.style.position = 'absolute';
	this.render_stats.domElement.style.top = '1px';
	this.render_stats.domElement.style.zIndex = 100;

	this.render_stats.domElement.hidden = true;
	document.body.appendChild(this.render_stats.domElement);
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
	context.fillText(Math.round(this.lander.fuel), 170, 140);

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
	camera.position.set( 0, 100, this.radius);
	// camera.position.set(0, 0, 100);
	camera.lookAt(new THREE.Vector3(0, 0, 0) );
	camera.h_rotation = 0;

	this.scene.add(camera);

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

	for (var i = 0; i < lights.length; i++) {
		this.scene.add(lights[i]);
	}

	return lights;
};


Game.prototype.render = function() {

	this.handle_keys();
	this.update_camera();
	this.update_hud();
	this.lander.update_thrust();
	this.lander.update_flames();
	this.handle_fuel_alert();
	this.handle_landing();

	if (this.game_started){
		this.lander.mesh.setLinearFactor(new THREE.Vector3(1, 1, 1));
		this.update_time();
		this.handle_reset();
		this.terrain.update(this.scene, this.camera.position);
	}
	else {
		this.lander.mesh.setLinearFactor(new THREE.Vector3(0, 0, 0));
	}

	this.scene.simulate();
	this.renderer.render( this.scene, this.camera );
	this.render_stats.update();
	requestAnimationFrame( this.render.bind(this) );
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
};

Game.prototype.handle_fuel_alert = function() {
	if (this.lander.fuel < 150) {
		startBeeping();
		this.message = "LOW FUEL ALERT";
	}
};

Game.prototype.handle_keys = function() {
	if (this.game_started) {
		this.lander.thrust_on = false;

		if (this.keyboard.pressed("w") || this.keyboard.pressed("up") || this.keyboard.pressed(" ")) {
			
			if (!this.landed && this.lander.fuel > 0) {
				this.lander.thrust_on = true;
				this.lander.apply_thrust();
			}
			
		}


		if (this.keyboard.pressed("a") || this.keyboard.pressed("left")) {
			this.lander.rotate_left();
		}
		if (this.keyboard.pressed("d") || this.keyboard.pressed("right")) {
			this.lander.rotate_right();
		}
	}
	else {
		this.lander.thrust_on = true;

		if (this.keyboard.pressed(" ")) {
			this.game_started = true;
			this.message = "";
		}
	}

	if (this.keyboard.pressed("1")) {
		this.render_stats.domElement.hidden = false;
	}
};

Game.prototype.handle_collision = function(other_object, relative_velocity, relative_rotation) {
	var vel = relative_velocity.length();

	if (!this.landed) {
		this.landing_vel = vel;
		this.landing_angle = this.lander.mesh.rotation.z;
		this.landing_time = new Date();
		this.landed = true;
	}
	else {
		this.landing_vel = Math.max(vel, this.landing_vel);
	}

	if (vel > 10) {
		this.message = "CATASTROPHIC FAILURE";
		this.game_status = "GAME OVER";
		this.landing_type = 2;
		this.lander.flames_on = true;
		playExplosion();
		this.assigned_score = true;
	}
	else if (vel > 6) {
		playHard();
	}
	else {
		playLand();
	}
}

Game.prototype.handle_landing = function() {

	if (this.landed) {
		var current_time = new Date();
		var angle_diff = Math.abs(this.lander.mesh.rotation.z - this.landing_angle);
		if (current_time - this.landing_time > 2000 && !this.assigned_score) {
			console.log(angle_diff*180/Math.PI);
			if (angle_diff*180/Math.PI > 20) {
				this.message = "TOO MUCH ANGLE";
				this.game_status = "GAME OVER";
				this.landing_type = 2;
				this.lander.flames_on = true;
			}
			else if (this.landing_vel > 6 && this.landing_vel < 10) {
				this.message = "HARD LANDING: 50PTS";
				this.game_status = "GAME OVER";
				this.score += 50;
				this.landing_type = 1;
			}
			else if (this.landing_vel < 6) {
				this.message = "PERFECT LANDING: 100PTS";
				this.score += 100;
				this.landing_type = 0;
				
			}
			this.landing_vel = 0;
			this.landing_angle = 0;
			this.assigned_score = true;
		}
	}
};

Game.prototype.handle_reset = function() {
	if (this.landed) {
		var current_time = new Date();
		if (current_time - this.landing_time > 5000) {
			this.lander.reset_lander(this.scene);
			this.lander.mesh.addEventListener( 'collision', this.handle_collision.bind(this));
			this.landed = false;
			this.message = "";
			this.game_status = "";
			stopBeeping();
			this.assigned_score = false;

			this.terrain.reset_terrain(this.scene);
			
			//Perfect
			if (this.landing_type == 0) {

			}
			//Hard + Catastrophic 
			else {
				this.score = 0;
				this.lander.fuel = this.lander.start_fuel;
				this.start_time = new Date();
				this.game_started = false;
				this.message = this.start_message;
				this.elapsed_time = 0;
			}
		}
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