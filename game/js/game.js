'use strict';

Physijs.scripts.worker = '../physijs_worker.js';
Physijs.scripts.ammo = 'game/js/ammo.js';

var Game = function() {};

var threexSparks;

Game.prototype.init = function() {
	this.renderer = this.initRenderer();
	this.renderer.setClearColorHex( 0x111111, 1 );
	document.body.appendChild(this.renderer.domElement);

	this.radius = 300;

	this.scene = this.initScene();

	this.camera = this.initCamera();
	this.camera.h_rotation = 0;
	this.scene.add(this.camera);

	this.lights = this.initLights();
	for (var i = 0; i < this.lights.length; i++) {
		this.scene.add(this.lights[i]);
	}

	this.lander = new Lander();
	this.scene.add(this.lander.mesh);
	this.scene.add(this.lander.sparks);
	this.scene.add(this.lander.thrust_light);



	this.ground = new Ground(0, 600, 600, 100, 100);
	this.scene.add(this.ground.mesh);

	this.ground2 = new Ground(600, 600, 600, 100, 100);
	this.scene.add(this.ground2.mesh);

	this.ground3 = new Ground(-600, 600, 600, 100, 100);
	this.scene.add(this.ground3.mesh);

	this.stars = this.initStars();
	this.scene.add(this.stars);

	this.keyboard = new THREEx.KeyboardState();

	requestAnimationFrame(this.render.bind(this));
	this.scene.simulate();
};

Game.prototype.initRenderer = function() {
	var renderer =  new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	return renderer;
};

Game.prototype.initScene = function() {
	var scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });
	scene.setGravity(new THREE.Vector3( 0, -9.8, 0 ));
	scene.fog = new THREE.FogExp2( 0x3B3B47, 0.001 );
	// scene.addEventListener(
	// 	'update',
	// 	function() {
	// 		scene.simulate( undefined, 2 );
	// 	}
	// );
	return scene;
};

Game.prototype.initCamera = function() {
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

Game.prototype.initLights = function() {
	var lights = [];
	// Light
	var d_light = new THREE.DirectionalLight( 0xFFFFFF );
	d_light.position.set( 20, 40, -15 );
	d_light.target.position.set(0, 0, 0);
	d_light.castShadow = true;
	d_light.shadowCameraLeft = -60;
	d_light.shadowCameraTop = -60;
	d_light.shadowCameraRight = 60;
	d_light.shadowCameraBottom = 60;
	d_light.shadowCameraNear = 20;
	d_light.shadowCameraFar = 200;
	d_light.shadowBias = -.0001
	d_light.shadowMapWidth = d_light.shadowMapHeight = 2048;
	d_light.shadowDarkness = .7;
	
	lights.push(d_light);

	var s_light = new THREE.SpotLight( 0xFFFFFF);
	s_light.position.set( 0, 400, 200 );
	s_light.target.position.copy( this.scene.position );
	s_light.castShadow = true;
	s_light.intensity = .7;
	s_light.shadowDarkness = .7;

	lights.push(s_light);
	return lights;
};

Game.prototype.initStars = function() {
	var urls = [
              'images/pos-x.png',
              'images/neg-x.png',
              'images/pos-y.png',
              'images/neg-y.png',
              'images/pos-z.png',
              'images/neg-z.png'
    ];
    var cubemap = THREE.ImageUtils.loadTextureCube(urls);
    cubemap.format = THREE.RGBFormat;

    var shader = THREE.ShaderLib["cube"];
    shader.uniforms["tCube"].texture = cubemap;

    var material = new THREE.ShaderMaterial({
    	fragmentShader: shader.fragmentShader,
    	vertexShader: shader.vertexShader,
    	uniforms: shader.uniforms
    });
	

    var geometry = new THREE.CubeGeometry( 100000, 100000, 100000, 1, 1, 1, null, true );

    var stars = new THREE.Mesh(
    		geometry,
    		material
    	);
    stars.flipSided = false;

    return stars;
};

Game.prototype.render = function() {
	this.scene.simulate();
	this.lander.update_sparks();
	this.handle_keys();
	this.update_camera();
	requestAnimationFrame( this.render.bind(this) );
	this.renderer.render( this.scene, this.camera );
};

Game.prototype.handle_keys = function() {
	this.lander.thrust_on = false;
	if (this.keyboard.pressed("w")) {
		this.lander.thrust_on = true;
		this.lander.apply_thrust();
		
	}
	if (this.keyboard.pressed("s")) {
		
	}
	if (this.keyboard.pressed("a")) {
		this.lander.rotate_left();
	}
	if (this.keyboard.pressed("d")) {
		this.lander.rotate_right();
	}
	// this.camera.position.x = this.radius*Math.sin( this.camera.h_rotation );         
	// this.camera.position.z = this.radius*Math.cos( this.camera.h_rotation );
	// this.camera.lookAt(this.scene.position);
};

Game.prototype.update_camera = function() {
	this.camera.position.x = this.lander.mesh.position.x;
	this.camera.position.y = 100;
	this.camera.position.z = Math.max(2*this.lander.mesh.position.y + 50, 50);

	this.camera.lookAt(this.lander.mesh.position);
};

var game = new Game();
window.addEventListener("load", game.init.bind(game));