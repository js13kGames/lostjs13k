/* jshint node: true, elision: true */
/* globals jsfxr */
'use strict';

let s = [
	// Fans
	[3,0.48,0.2,0.68,0.7694,0.0148,,0.9602,,0.2499,,-0.0549,-0.0738,0.096,0.0641,0.4837,0.6,-0.0364,0.254,-0.2507,0.3391,0.575,-0.5669,0.57],
	// Beep
	[2,0.0291,0.0583,0.2147,0.8409,0.35,0.0635,0.0459,-0.0634,,0.0155,0.2254,0.683,0.8177,-0.0768,0.3105,0.2867,-0.2637,0.5362,0.0717,,0.2806,-0.1257,0.5],
	// Damage
	[3,0.0351,0.6046,0.3476,0.2765,0.5924,,-0.0441,-0.7271,,,-0.1849,,0.8845,0.0752,0.2964,-0.0093,0.8966,0.5593,-0.4031,,0.0586,-0.0038,0.5]
];

var BS = 10;
s = s.map(a=>jsfxr(a)).map(j=>[...Array(BS).keys()].map(()=>new Audio(j)));

console.log(s);

let playing = {};
let curr = [0,0,0];
module.exports = {
	enabled: true,
	play: function(i){
		if (!this.enabled || playing[i]){
			return;
		}
		playing[i] = true;
		var player = s[i][curr[i]++];
		if (curr[i] == BS){
			curr[i] = 0;
		}
		player.play().catch(()=>{console.log("splunk!");});
		setTimeout(()=>playing[i]=false, 300);
	}
};