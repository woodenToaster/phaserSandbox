var playState = {

	create: function() {
		//Register input keys
		this.cursor = game.input.keyboard.createCursorKeys();
		this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.space.onDown.add(this.pauseMenu, this);
		this.lbutton = game.input.mouse.add

		//Rectangle to darken game screen when scripting pane is open
		this.darkenData = game.add.bitmapData(500, 340);
		this.darkenData.ctx.beginPath();
  	this.darkenData.ctx.rect(0, 0, 500, 340);
  	this.darkenData.ctx.fillStyle = '#000000';
  	this.darkenData.ctx.fill();
  	this.darken = game.add.sprite(game.world.centerX, game.world.centerY, this.darkenData);
  	this.darken.anchor.setTo(0.5, 0.5);
  	this.darken.alpha = 0;
  	
  	//Scripting enabled flag
  	this.scriptingEnabled = false;

  	//Scripting Pane
  	this.scriptingPane = game.add.bitmapData(250, 170);
  	this.scriptingPane.ctx.beginPath();
  	this.scriptingPane.ctx.rect(0, 0, 250, 170);
  	this.scriptingPane.ctx.fillStyle = '#FFFFFF';
  	this.scriptingPane.ctx.fill();
  	this.pane = game.add.sprite(game.world.centerX, game.world.centerY, this.scriptingPane);
  	this.pane.anchor.setTo(0.5, 0.5);
  	this.pane.alpha = 0;

		this.player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
		this.player.anchor.setTo(0.5, 0.5);
		game.physics.arcade.enable(this.player);
		this.player.body.gravity.y = 500;
		this.enemies = game.add.group();
		this.enemies.enableBody = true;
		this.enemies.createMultiple(10, 'enemy');
		this.coin = game.add.sprite(60, 140, 'coin');
		game.physics.arcade.enable(this.coin);
		this.coin.anchor.setTo(0.5, 0.5);

		this.scoreLabel = game.add.text(30, 30, 'score: 0', 
			{font: '18px Arial', fill: '#ffffff' }
		);
		game.global.score = 0;
		this.createWorld();
		
		this.nextEnemy = 0;
		this.paused = false;

		//Add sounds
		this.jumpSound = game.add.audio('jump');
		this.coinSound = game.add.audio('coin');
		this.deadSound = game.add.audio('dead');

		//Add Animations
		this.player.animations.add('right', [1, 2], 8, true);
		this.player.animations.add('left', [3, 4], 8, true);

		//Set up emitter
		this.emitter = game.add.emitter(0, 0, 15);
		this.emitter.makeParticles('pixel');
		this.emitter.setYSpeed(-150, 150);
		this.emitter.setXSpeed(-150, 150);
		this.emitter.gravity = 0;

		//Keep keyboard input from being sent to the browser
		game.input.keyboard.addKeyCapture([
			Phaser.Keyboard.UP, 
			Phaser.Keyboard.DOWN,
			Phaser.Keyboard.LEFT,
			Phaser.Keyboard.RIGHT,
			Phaser.Keyboard.SPACEBAR
		]);

		//Use WASD to move
		this.wasd = {
			up: game.input.keyboard.addKey(Phaser.Keyboard.W),
			left: game.input.keyboard.addKey(Phaser.Keyboard.A),
			right: game.input.keyboard.addKey(Phaser.Keyboard.D)
		};


		if(!game.device.desktop) {
			this.addMobileInputs(); 
		}

		this.darken.bringToTop();
	},

	update: function() {
		
			game.physics.arcade.collide(this.player, this.layer);
			game.physics.arcade.collide(this.enemies, this.layer);
			game.physics.arcade.overlap(this.player, this.coin, this.takeCoin, null, this);
			game.physics.arcade.overlap(this.player, this.enemies, this.playerDie, null, this);
			
			if(!this.paused) {
				if(this.scriptingEnabled == true) {
					this.disableScripting();
				}

				this.movePlayer();
				if (!this.player.inWorld) {
					this.playerDie();
		    }

		    if(this.nextEnemy < game.time.now) {
		    	
		    	var start = 4000;
		    	var end = 1000;
		    	var score = 100;

		    	var delay = Math.max(start - (start - end) * game.global.score / score, end);

		    	this.addEnemy();
		    	this.nextEnemy = game.time.now + delay;
		    }
		  } else {
		  	this.enableScripting();
		  }
  },

	movePlayer: function() {
		//Move left
		if (this.cursor.left.isDown || this.wasd.left.isDown || this.moveLeft) {
			this.player.body.velocity.x = -200;
			this.player.animations.play('left');
	  }
	  //Move right
		else if (this.cursor.right.isDown || this.wasd.right.isDown || this.moveRight) {
			this.player.body.velocity.x = 200;
			this.player.animations.play('right');
	  }
	  //Stop
	  else {
			this.player.body.velocity.x = 0;
			this.player.animations.stop();
			this.player.frame = 0;
	  }
	  //Jump
		if (this.cursor.up.isDown || this.wasd.up.isDown) {
			this.jumpPlayer();
	  }
  },

  pauseMenu: function() {
  	
	  if (!this.paused) {
	  	this.paused = true;
	  	this.freezeEnemies();
	  	this.freezePlayer(this.player.body.velocity.y);
	  	this.darken.alpha = 0.5;
	  } else {
	  	this.paused = false;
	  	this.unfreezeEnemies();
	  	this.unfreezePlayer();
	  	this.darken.alpha = 0;
	  	this.darken.bringToTop();
	  }
  },

  
  enableScripting: function() {
  	//Enable input events on sprites
  	this.enemies.forEachAlive(function(enemy){
  		enemy.inputEnabled = true;
  		enemy.events.onInputDown.add(this.openScriptPane, this);
  	}, this);

  	this.player.inputEnabled = true;
  	this.player.events.onInputDown.add(this.openScriptPane, this);

  	

  	this.coin.inputEnabled = true;
  	this.coin.events.onInputDown.add(this.openScriptPane, this);
  	this.scriptingEnabled = true;
  },

  openScriptPane: function() {
  	//$('#scriptingPane').modal();
  	this.pane.alpha = 1;
  	this.pane.bringToTop();
  	this.darken.inputEnabled = true;
  	this.darken.events.onInputDown.add(this.dismissScriptPane, this);
  },

  dismissScriptPane: function() {
  	this.darken.inputEnabled = false;
  	this.pane.alpha = 0;
  },
	
  disableScripting: function() {
  	this.enemies.forEachAlive(function(enemy){
  		enemy.inputEnabled = false;
  	}, this);

  	this.player.inputEnabled = false;
  	this.coin.inputEnabled = false;
  	this.scriptingEnabled = false;
  },

  freezePlayer: function(yVel) {
  	this.playerVelY = yVel;
  	this.player.body.velocity.x = 0;
  	this.player.body.velocity.y = 0;
  	this.player.body.gravity.y = 0;
	  this.player.animations.stop();
  },

  unfreezePlayer: function() {
  	this.player.body.velocity.y = this.playerVelY;
  	this.player.body.gravity.y = 500;
  },

  freezeEnemies: function() {
  	this.enemies.forEachAlive(function(enemy){
  		enemy.body.gravity.y = 0;
  		enemy.Yvel = enemy.body.velocity.y;
  		enemy.body.velocity.y = 0;
  		enemy.direction = enemy.body.velocity.x > 0 ? 'right' : 'left';
  		enemy.body.velocity.x = 0;
  	}, this);
  },

  unfreezeEnemies: function() {
  	this.enemies.forEachAlive(function(enemy){
  		enemy.body.gravity.y = 500;
  		enemy.body.velocity.y = enemy.Yvel;
  	  if(enemy.direction == 'right') {
  	  	enemy.body.velocity.x = 100;
  	  } else {
  	  	enemy.body.velocity.x = -100;
  	  }
  	}, this);
  },

	takeCoin: function(player, coin) {
		this.coinSound.play();
		game.global.score += 5;
		this.scoreLabel.text = 'score: ' + game.global.score;
		this.updateCoinPosition();
		this.coin.scale.setTo(0, 0);
		game.add.tween(this.coin.scale).to({x: 1, y: 1}, 300).start();
		game.add.tween(this.player.scale).to({x: 1.3, y: 1.3}, 50).to({x: 1, y: 1}, 150).start();
  },
	
	updateCoinPosition: function() {
		var coinPosition = [
			{x: 140, y: 60}, {x: 360, y: 60},
			{x: 60, y: 140}, {x: 440, y: 140},
			{x: 130, y: 300}, {x: 370, y: 300}
    ];

		for (var i = 0; i < coinPosition.length; i++) {
			if (coinPosition[i].x === this.coin.x) {
				coinPosition.splice(i, 1);
			}
		}
		var newPosition = coinPosition[game.rnd.integerInRange(0,
		coinPosition.length-1)];
		this.coin.reset(newPosition.x, newPosition.y);
	},

	addEnemy: function() {
		var enemy = this.enemies.getFirstDead();
		if (!enemy) {
			return;
		}
		enemy.anchor.setTo(0.5, 1);
		enemy.reset(game.world.centerX, 0);
		enemy.body.gravity.y = 500;
		enemy.body.velocity.x = 100 * Phaser.Math.randomSign();
		enemy.body.bounce.x = 1;
		enemy.checkWorldBounds = true;
		enemy.outOfBoundsKill = true;
	},

	createWorld: function() {
		this.map = game.add.tilemap('map');
		this.map.addTilesetImage('tileset');
		this.layer = this.map.createLayer('Tile Layer 1');
		this.layer.resizeWorld();
		this.map.setCollision(1);
	},

  playerDie: function() {
		
		if(!this.player.alive) {
			return;
		}

		this.deadSound.play();
		this.player.kill();
		this.emitter.x = this.player.x;
		this.emitter.y = this.player.y;
		this.emitter.start(true, 600, null, 15);
		game.time.events.add(1000, this.startMenu, this);
  },

  addMobileInputs: function() {
  	this.jumpButton = game.add.sprite(350, 247, 'jumpButton');
  	this.jumpButton.inputEnabled = true;
  	this.jumpButton.events.onInputDown.add(this.jumpPlayer, this);
  	this.jumpButton.alpha = 0.5;

  	this.moveLeft = false;
  	this.moveRight = false;

  	this.leftButton = game.add.sprite(50, 247, 'leftButton');
  	this.leftButton.inputEnabled = true;
  	this.leftButton.events.onInputOver.add(function(){this.moveLeft=true;}, this);
		this.leftButton.events.onInputOut.add(function(){this.moveLeft=false;}, this);
		this.leftButton.events.onInputDown.add(function(){this.moveLeft=true;}, this);
		this.leftButton.events.onInputUp.add(function(){this.moveLeft=false;}, this);
  	this.leftButton.alpha = 0.5;

  	this.rightButton = game.add.sprite(130, 247, 'rightButton');
  	this.rightButton.inputEnabled = true;
  	this.leftButton.events.onInputOver.add(function(){this.moveRight=true;}, this);
		this.leftButton.events.onInputOut.add(function(){this.moveRight=false;}, this);
		this.leftButton.events.onInputDown.add(function(){this.moveRight=true;}, this);
		this.leftButton.events.onInputUp.add(function(){this.moveRight=false;}, this);
  	this.rightButton.alpha = 0.5;

  	
  },

  jumpPlayer: function() {
  	if(this.player.body.onFloor()) {
  		this.jumpSound.play();
  		this.player.body.velocity.y = -320;
  		
  	}
  },

  startMenu: function() {
  	game.state.start('menu');
  }
};