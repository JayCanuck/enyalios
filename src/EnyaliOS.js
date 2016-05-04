var
	Control = require('enyo/Control'),
	StatusBar = require('./StatusBar'),
	SearchBar = require('./SearchBar'),
	GestureBar = require('./GestureBar');

module.exports = Control.kind({
	name: 'EnyaliOS',
	fit:true,
	style:'background:black; display:flex; flex-direction: column;',
	components: [
		{kind:StatusBar},
		{style:"flex:1;border-radius:1.5rem;background: white url('@../assets/wallpaper.jpg'); background-size: cover;", components: [
			{kind:SearchBar}
		]},
		{kind:GestureBar}
	]
});
