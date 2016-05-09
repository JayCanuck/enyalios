var
	Control = require('enyo/Control'),
	StatusBar = require('./ui/StatusBar'),
	SearchBar = require('./ui/SearchBar'),
	GestureBar = require('./ui/GestureBar');

module.exports = Control.kind({
	name: 'EnyaliOS',
	fit:true,
	style:'background:black; display:flex; flex-direction: column;',
	components: [
		{kind:StatusBar},
		{style:"flex:1;border-radius:1.5rem;background: url('@../assets/wallpapers/01.jpg') no-repeat center center; background-size: cover;", components: [
			{kind:SearchBar}
		]},
		{kind:GestureBar}
	]
});
