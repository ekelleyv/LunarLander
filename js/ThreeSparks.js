var THREE=THREE||{};

THREE.Particles = (function(){
    var numMax=Number.MAX_VALUE;
    function VectorPool(vectors){
        var __pools= vectors;
        this.get= function() {
            if (__pools.length<=0) throw Error("Have no enough particles");
            return __pools.pop();
        };
        this.release= function(v) {
            v.set(numMax,numMax,numMax); //move vertice to invisible location
            __pools.push(v);
        };
    }

    function SparkParticle(options){
        if (typeof options=="undefined") options={};
        _.defaults(options,{
                size:10,
                count: 100,
                position: new THREE.Vector3(0,0,0),
                program:function(ctx){
                    ctx.fillRect(0, 0, 10, 10);
                },
                sparksInit: function(emitter, SPARKS){
                    var sphereCap = new SPARKS.SphereCapZone(0, 0, 0, 0, 0, 10);
                    emitter.addInitializer(new SPARKS.Lifetime(0,2));
                    emitter.addInitializer(new SPARKS.Velocity(sphereCap));
                    emitter.addAction(new SPARKS.Age());
                    emitter.addAction(new SPARKS.Move());
                    //emitter.addAction(new SPARKS.RandomDrift(10,150,20));
                    emitter.addAction(new SPARKS.Accelerate(0.2));
                }
            }
        );
        var canvas = document.createElement("canvas");
            canvas.width=options.size;
            canvas.height=options.size;
            var ctx= canvas.getContext("2d");
            ctx.fillStyle = options.color || "red";
            options.program(ctx);
            // document.getElementsByTagName("body")[0].appendChild(canvas);
        var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
        var geometry = new THREE.Geometry();
        var pMaterial = new THREE.ParticleBasicMaterial({
                                color: options.color||"red",
                                size: options.size,
                                map: texture,
                                transparent: true
                              });

        var v;
        var arr=[];
        for(var p = 0; p <= options.count*10; p++){
            v = new THREE.Vector3(numMax,numMax,numMax);
            geometry.vertices.push(v);
            arr.push(v)
        }
        THREE.ParticleSystem.call( this, geometry, pMaterial );
        this.position=options.position;
        var vectorPool = new VectorPool(arr);
        this.sortParticles = true;
        this.emitterPosition = this.position.clone();
        this.sparksEmitter = new SPARKS.Emitter(new SPARKS.SteadyCounter(options.count), {VectorPool: vectorPool});
        this.sparksEmitter.addInitializer(new SPARKS.Position( new SPARKS.PointZone( this.emitterPosition ) ) );
        options.sparksInit(this.sparksEmitter, SPARKS);

        this.sparksEmitter.addCallback("created", function(){
            geometry.__dirtyVertices = true;
            geometry.__dirtyElements = true;
        });
        this.sparksEmitter.addCallback("dead", function(){
            geometry.__dirtyVertices = true;
            geometry.__dirtyElements = true;
        });

        this.sparksEmitter.start();
    }
    SparkParticle.prototype = Object.create( THREE.ParticleSystem.prototype );

    return SparkParticle;
})();