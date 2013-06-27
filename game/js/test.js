function ThreeJSStart() {
	var renderer = new THREE.WebGLRenderer({ antialias : true });
	renderer.setSize(document.body.clientWidth, document.body.clientHeight);
	document.body.appendChild(renderer.domElement);
    


	renderer.setClearColorHex(0, 1.0);
	renderer.clear();
	


	var scene = new THREE.Scene();

	var fov = 35; // camera field-of-view in degrees
	var width = renderer.domElement.width;
	var height = renderer.domElement.height;
	var aspect = width / height; // view aspect ratio
	var near = 1; // near clip plane
	var far = 1000; // far clip plane
	var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position = new THREE.Vector3(0, 0, 100);
	camera.lookAt( new THREE.Vector3(0, 0, 0) );
	scene.add( camera );
	
	var clock = new THREE.Clock();

	
	
	// ------------ SPARKS.JS Code ------------------------------------

	threexSparks	= new THREEx.Sparks({
		maxParticles	: 600,
		counter		: new SPARKS.SteadyCounter(300)
	});

	// setup the emitter
	var emitter	= threexSparks.emitter();

	var initColorSize	= function(){
		this.initialize = function( emitter, particle ){
			particle.target.color().setHSV(0.3, 0.9, 0.4);
			particle.target.size(150);
		};
	};


	emitter.addInitializer(new initColorSize());
	emitter.addInitializer(new SPARKS.Position( new SPARKS.PointZone( new THREE.Vector3(0,0,0) ) ) );
	emitter.addInitializer(new SPARKS.Lifetime(0,0.8));
	emitter.addInitializer(new SPARKS.Velocity(new SPARKS.PointZone(new THREE.Vector3(0,200,0))));

	emitter.addAction(new SPARKS.Age());
	emitter.addAction(new SPARKS.Move());
	emitter.addAction(new SPARKS.RandomDrift(1000,0,1000));
	emitter.addAction(new SPARKS.Accelerate(0,-200,0));

	
	
	// ------------------------------------------------------------------
	
	threexSparks.emitter().start();	
	scene.add(threexSparks.container());




    renderer.render(scene, camera);
    var paused = false;
    var last = new Date().getTime();
    function animate(t) {
    	if (!paused) {
    		last = t;
    		
    		renderer.clear();
    		
    		threexSparks	&& threexSparks.update();
    		
    		renderer.render(scene, camera);
      }
      window.requestAnimationFrame(animate, renderer.domElement);
    };
    animate(new Date().getTime());
    onmessage = function(ev) {
    	paused = (ev.data == 'pause');
    };
}