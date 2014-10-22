var bootState = {
	
	preload: function() {
		game.load.image('progressBar', 'assets/progressBar.png');
	},

	create: function() {
		game.stage.backgroundColor = '#3498DB';
		game.physics.startSystem(Phaser.Physics.ARCADE);
		game.state.start('load');
	}
};