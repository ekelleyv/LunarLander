

var audioLibParams = {
	explosion :["noise",1.0000,0.6610,0.0000,0.6020,2.0550,2.0000,20.0000,1210.0000,2000.0000,0.0000,0.0000,0.0000,7.9763,0.0003,0.0000,0.0000,0.1000,0.0000,0.0000,0.0000,-0.0100,0.0260,0.3210,1.0000,1.0000,0.0000,0.0000],
	hard : ["noise",1.0000,0.3590,0.0160,0.1160,2.2590,0.8340,20.0000,1210.0000,2000.0000,0.0000,0.0000,0.0000,7.9763,0.0003,0.0000,0.0000,0.1000,0.0000,0.0000,0.0000,-0.0100,0.0260,0.3210,1.0000,1.0000,0.0000,0.0000],
	land : ["noise",1.0000,0.0650,0.1700,0.1120,0.0690,0.5120,20.0000,1210.0000,2000.0000,0.0000,0.0000,0.0000,7.9763,0.0003,0.0000,0.0000,0.1000,0.0000,0.0000,0.0000,-0.0100,0.0260,0.3210,1.0000,1.0000,0.0000,0.0000],
	thruster : ["noise",0.0000,1.0000,0.0000,10.0000,0.0000,0.0000,20.0000, 281.0000,2400.0000,0.0000,0.0000,0.0000,7.9763,0.0003,0.0000,0.0000,0.0000,0.2515,0.0000,0.2544,0.0000,0.0000,0.2730,0.0000,0.3790,0.0000,0.0000],
	beep :    ["square",0.0000, 0.030,0.0000,0.3000,0.0000,0.0000,20.0000,1210.0000,  20.0000,0.0000,0.0000,0.0000,7.9763,0.0003,0.0000,0.0000,0.1000,0.0000,0.0000,0.4632,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]
	
 };

var samples = jsfxlib.createWaves(audioLibParams);
  // samples.test.play();
  // samples.explosion.play();
samples.thruster.loop = true; 
//samples.thruster.play(); 

samples.beep.volume = 0.3; 
var thrustSound = samples.thruster; 
var thrustInterval = 0; 
var beepInterval = 0;
var thrustPlaying = false; 
var thrustVolume = 0; 
var thrustTargetVolume = 0 ;
var thrustOn = false;
var beeping = false;

//playThruster();


function setThrustVolume(vol) { 
	thrustTargetVolume = vol; 
	if((vol>0) && (!thrustPlaying)) {
		playThruster(); 
	}
	
	
}

function playThruster() { 
	if(thrustInterval) clearInterval(thrustInterval); 
	thrustOn = true;
	if(thrustPlaying) {
		return;
		// thrustSound.pause(); 
	
	}
	
	thrustSound.play(); 
	thrustSound.currentTime =0; 
	thrustInterval = setInterval(increaseThruster, 10); 
	thrustPlaying = true;
}

function increaseThruster(e) { 
	if(thrustSound.currentTime>8.5) thrustSound.currentTime=0.1; 

	if(thrustVolume!=thrustTargetVolume){
		thrustVolume+=((thrustTargetVolume-thrustVolume)*0.1); 
		if(Math.abs(thrustVolume-thrustTargetVolume)<0.01) 
			thrustVolume = thrustTargetVolume; 
		thrustSound.volume = thrustVolume;
		console.log(thrustSound.volume);
	}
	if(thrustVolume<=0) stopThruster(); 
}

function decreaseThruster(e) { 
	if (!thrustOn) return;
	if(thrustVolume != 0){
		thrustVolume -= (thrustVolume*0.1); 
		thrustSound.volume = thrustVolume; 
		console.log(thrustSound.volume);
	}
	if(thrustVolume<=.01) {
		console.log("calling stopThruster");
		stopThruster();
		thrustOn = false;
		thrustSound.pause(); 
	}
}

function stopThruster() {

	if(!thrustPlaying) return; 
	//thrustSound.currentTime = 2.5; 
	clearInterval(thrustInterval); 
	thrustPlaying = false; 
	
	
}

function thrusterOff() {
	if (!thrustOn) return;
	thrustInterval = setInterval(decreaseThruster, 10);

}

function playExplosion() {
	samples.explosion.play();
}

function playHard() {
	samples.hard.play();
}

function playLand() {
	samples.land.play();
}

function startBeeping() {
	if (!beeping) {
		beepInterval = setInterval(playBeep, 800);
		beeping = true;
	}
}

function playBeep() {
	console.log("beep");
	samples.beep.play();
}

function stopBeeping() {
	if (beeping) {
		clearInterval(beepInterval);
		beeping = false;
	}
}

	
	
