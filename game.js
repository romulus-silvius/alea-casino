// ============================================
// ALEA CASINO - GBA Style Blackjack Game
// ============================================

const COLORS = {
  purple: 0x4a1c6b,
  darkPurple: 0x2d1147,
  gold: 0xc9a227,
  darkGold: 0x8a6f1a,
  cream: 0xf5e6c8,
  red: 0xc41e3a,
  black: 0x1a1a1a,
  green: 0x228b22,
  cardWhite: 0xfffef0,
  cardRed: 0xd42020,
  cardBlack: 0x1a1a1a,
};

const TILE_SIZE = 16;
const SCALE = 2;

// ============================================
// CARD CLASS
// ============================================
class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.faceUp = false;
  }
  
  get value() {
    if (this.rank === 1) return 11;
    if (this.rank > 10) return 10;
    return this.rank;
  }
  
  get displayRank() {
    const ranks = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    return ranks[this.rank];
  }
  
  get displaySuit() {
    const suits = { 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣', 'spades': '♠' };
    return suits[this.suit];
  }
  
  get isRed() {
    return this.suit === 'hearts' || this.suit === 'diamonds';
  }
}

// ============================================
// DECK CLASS
// ============================================
class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }
  
  reset() {
    this.cards = [];
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    for (let s = 0; s < suits.length; s++) {
      for (let r = 1; r <= 13; r++) {
        this.cards.push(new Card(suits[s], r));
      }
    }
    this.shuffle();
  }
  
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  
  deal() {
    if (this.cards.length < 10) this.reset();
    return this.cards.pop();
  }
}

// ============================================
// MAIN GAME SCENE
// ============================================
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.gameState = 'explore';
    this.player = null;
    this.cursors = null;
    this.deck = new Deck();
    this.playerHand = [];
    this.dealerHand = [];
    this.playerTotal = 0;
    this.dealerTotal = 0;
    this.bet = 10;
    this.chips = 100;
    this.canAct = false;
    this.message = '';
    this.lastInput = 0;
    this.touchKeys = { up: false, down: false, left: false, right: false, z: false, x: false };
  }
  
  preload() {}
  
  create() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Create simple 1x1 colored textures
    this.createSimpleTexture('gold', 0xc9a227);
    this.createSimpleTexture('grass', 0x3d6b3d);
    this.createSimpleTexture('floor', 0x8b7355);
    this.createSimpleTexture('wall', 0x5c4033);
    this.createSimpleTexture('purple', 0x4a1c6b);
    this.createSimpleTexture('cardBack', 0x1a1a6b);
    this.createSimpleTexture('dark', 0x1a1a2e);
    this.createSimpleTexture('felt', 0x0a4a0a);
    this.createSimpleTexture('cream', 0xf5e6c8);
    this.createSimpleTexture('red', 0xc41e3a);
    this.createSimpleTexture('white', 0xffffff);
    
    if (this.gameState === 'explore') {
      this.createOverworld();
    } else if (this.gameState === 'casino') {
      this.createCasino();
    } else if (this.gameState === 'blackjack') {
      this.createBlackjack();
    }
    
    // Touch input polling
    this.time.addEvent({ delay: 50, callback: this.pollTouchInput, callbackScope: this, loop: true });
  }
  
  createSimpleTexture(name, color) {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(color);
    gfx.fillRect(0, 0, 8, 8);
    gfx.generateTexture(name, 8, 8);
  }
  
  pollTouchInput() {
    if (this.cursors && window.touchKeys) {
      if (window.touchKeys.up) this.cursors.up.isDown = true;
      if (window.touchKeys.down) this.cursors.down.isDown = true;
      if (window.touchKeys.left) this.cursors.left.isDown = true;
      if (window.touchKeys.right) this.cursors.right.isDown = true;
    }
  }
  
  createOverworld() {
    // Ground - green grass tiles
    for (let x = 0; x < 30; x++) {
      for (let y = 0; y < 20; y++) {
        this.add.image(x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, 'grass').setScale(SCALE * 2);
      }
    }
    
    // Casino building - purple walls
    for (let x = 10; x < 18; x++) {
      for (let y = 6; y < 12; y++) {
        const tx = x * TILE_SIZE * SCALE;
        const ty = y * TILE_SIZE * SCALE;
        if (y === 11) {
          this.add.image(tx, ty, 'floor').setScale(SCALE * 2);
        } else {
          this.add.image(tx, ty, 'purple').setScale(SCALE * 2);
        }
      }
    }
    
    // Door - brown rectangle
    const door = this.add.rectangle(13 * TILE_SIZE * SCALE + 16, 11 * TILE_SIZE * SCALE, 32, 48, 0x5c4033);
    door.setStrokeStyle(2, 0xc9a227);
    
    // Sign
    const sign = this.add.rectangle(14 * TILE_SIZE * SCALE + 16, 4 * TILE_SIZE * SCALE, 64, 32, 0x5c4033);
    sign.setStrokeStyle(2, 0xc9a227);
    
    this.add.text(14 * TILE_SIZE * SCALE - 20, 4 * TILE_SIZE * SCALE - 8, 'ALEA', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    });
    
    // Player - gold square
    this.player = this.add.rectangle(14 * TILE_SIZE * SCALE + 16, 14 * TILE_SIZE * SCALE, 24, 24, 0xc9a227);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-Z', this.interact, this);
    this.input.keyboard.on('keydown-ENTER', this.interact, this);
    
    this.add.text(8, 8, 'ARROWS: Move  Z: Enter', {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#c9a227',
    });
  }
  
  createCasino() {
    // Floor - brown tiles
    for (let x = 0; x < 30; x++) {
      for (let y = 0; y < 20; y++) {
        this.add.image(x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, 'floor').setScale(SCALE * 2);
      }
    }
    
    // Walls
    for (let x = 0; x < 30; x++) {
      this.add.image(x * TILE_SIZE * SCALE, 2 * TILE_SIZE * SCALE, 'wall').setScale(SCALE * 2);
      this.add.image(x * TILE_SIZE * SCALE, 17 * TILE_SIZE * SCALE, 'wall').setScale(SCALE * 2);
    }
    for (let y = 2; y < 18; y++) {
      this.add.image(2 * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, 'wall').setScale(SCALE * 2);
      this.add.image(27 * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, 'wall').setScale(SCALE * 2);
    }
    
    // Exit zone
    this.exitZone = this.add.rectangle(15 * 16 * SCALE, 17 * 16 * SCALE - 8, 64, 8, 0xc9a227).setOrigin(0.5);
    
    // Blackjack table - purple
    const table = this.add.rectangle(15 * TILE_SIZE * SCALE + 16, 10 * TILE_SIZE * SCALE, 96, 64, 0x4a1c6b);
    table.setStrokeStyle(4, 0xc9a227);
    
    // Dealer - dark square
    this.dealer = this.add.rectangle(15 * TILE_SIZE * SCALE + 16, 6 * TILE_SIZE * SCALE, 24, 24, 0x1a1a2e);
    this.dealer.setStrokeStyle(2, 0xc9a227);
    
    // Play prompt
    this.playPrompt = this.add.text(15 * TILE_SIZE * SCALE - 60, 14 * TILE_SIZE * SCALE, '[Z] Play Blackjack', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
      backgroundColor: '#1a1a2e',
      padding: { x: 8, y: 4 },
    });
    
    // Chip display
    this.add.text(8, 8, `CHIPS: ${this.chips}`, {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#c9a227',
    });
    
    // Player
    this.player = this.add.rectangle(15 * TILE_SIZE * SCALE + 16, 14 * TILE_SIZE * SCALE, 24, 24, 0xc9a227);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-Z', this.interactCasino, this);
    this.input.keyboard.on('keydown-ENTER', this.interactCasino, this);
    this.input.keyboard.on('keydown-X', this.exitCasino, this);
    
    this.add.text(8, 296, 'Z: Interact  X: Exit', {
      fontFamily: 'Press Start 2P',
      fontSize: '6px',
      color: '#888',
    });
  }
  
  createBlackjack() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Felt table
    const felt = this.add.rectangle(240, 160, 400, 240, 0x0a4a0a);
    felt.setStrokeStyle(4, 0xc9a227);
    
    // Dealer label
    this.add.text(200, 50, 'DEALER', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    });
    
    // Player label
    this.add.text(180, 170, 'YOUR HAND', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    });
    
    // Bet display
    this.betText = this.add.text(80, 260, `BET: ${this.bet}`, {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    });
    
    // Chips display
    this.chipsText = this.add.text(280, 260, `CHIPS: ${this.chips}`, {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    });
    
    // Deal button
    this.dealBtn = this.add.text(200, 240, '[Z] DEAL', {
      fontFamily: 'Press Start 2P',
      fontSize: '12px',
      color: '#c9a227',
      backgroundColor: '#1a1a2e',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    
    // Action buttons
    this.hitBtn = this.add.text(100, 240, '[Z] HIT', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#228b22',
      backgroundColor: '#1a1a2e',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setVisible(false);
    
    this.standBtn = this.add.text(200, 240, '[X] STAND', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c41e3a',
      backgroundColor: '#1a1a2e',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setVisible(false);
    
    this.doubleBtn = this.add.text(300, 240, '[C] DOUBLE', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
      backgroundColor: '#1a1a2e',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setVisible(false);
    
    // Message text
    this.msgText = this.add.text(240, 120, '', {
      fontFamily: 'Press Start 2P',
      fontSize: '12px',
      color: '#f5e6c8',
    }).setOrigin(0.5);
    
    // Back button
    this.add.text(380, 20, '[X] Exit', {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#888',
    });
    
    // Controls
    this.input.keyboard.on('keydown-Z', this.actionZ, this);
    this.input.keyboard.on('keydown-X', this.actionX, this);
    this.input.keyboard.on('keydown-C', this.actionC, this);
    this.input.keyboard.on('keydown-ENTER', this.actionZ, this);
    
    this.dealState = true;
    this.drawCards();
  }
  
  drawCards() {
    // Clear old cards
    if (this.cardGroup) {
      this.cardGroup.clear(true, true);
    }
    this.cardGroup = this.add.group();
    
    // Draw player cards
    let x = 100;
    for (let i = 0; i < this.playerHand.length; i++) {
      this.drawCard(x, 200, this.playerHand[i], true);
      x += 40;
    }
    
    // Draw dealer cards
    x = 100;
    for (let i = 0; i < this.dealerHand.length; i++) {
      this.drawCard(x, 80, this.dealerHand[i], i === 0 || this.canAct);
      x += 40;
    }
    
    // Totals
    this.add.text(300, 90, this.canAct || this.gameOver ? `${this.dealerTotal}` : '?', {
      fontFamily: 'Press Start 2P',
      fontSize: '14px',
      color: '#f5e6c8',
    });
    
    this.add.text(300, 210, `${this.playerTotal}`, {
      fontFamily: 'Press Start 2P',
      fontSize: '14px',
      color: '#f5e6c8',
    });
  }
  
  drawCard(x, y, card, faceUp) {
    const bg = this.add.rectangle(x, y, 28, 40, 0xfffef0);
    bg.setStrokeStyle(1, 0xcccccc);
    this.cardGroup.add(bg);
    
    if (!faceUp) {
      const back = this.add.rectangle(x, y, 24, 36, 0x1a1a6b);
      back.setStrokeStyle(1, 0xc9a227);
      this.cardGroup.add(back);
      return;
    }
    
    const color = card.isRed ? '#d42020' : '#1a1a1a';
    
    this.add.text(x - 8, y - 12, card.displayRank, {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: color,
    }).setOrigin(0.5);
    
    this.add.text(x, y + 2, card.displaySuit, {
      fontSize: '16px',
      color: color,
    }).setOrigin(0.5);
    
    this.add.text(x - 8, y + 12, card.displayRank, {
      fontFamily: 'Press Start 2P',
      fontSize: '6px',
      color: color,
    }).setOrigin(0.5);
  }
  
  calculateTotal(hand) {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
      total += card.value;
      if (card.rank === 1) aces++;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }
  
  deal() {
    if (this.chips < this.bet) {
      this.msgText.setText('NOT ENOUGH CHIPS!');
      return;
    }
    
    this.chips -= this.bet;
    this.chipsText.setText(`CHIPS: ${this.chips}`);
    
    this.playerHand = [this.deck.deal(), this.deck.deal()];
    this.dealerHand = [this.deck.deal(), this.deck.deal()];
    
    this.playerTotal = this.calculateTotal(this.playerHand);
    this.dealerTotal = this.calculateTotal(this.dealerHand);
    
    this.canAct = true;
    this.dealState = false;
    this.gameOver = false;
    
    this.dealBtn.setVisible(false);
    this.hitBtn.setVisible(true);
    this.standBtn.setVisible(true);
    this.doubleBtn.setVisible(true);
    this.doubleBtn.setAlpha(this.chips >= this.bet ? 1 : 0.5);
    
    if (this.playerTotal === 21) {
      this.dealerTurn();
    }
    
    this.drawCards();
  }
  
  hit() {
    this.playerHand.push(this.deck.deal());
    this.playerTotal = this.calculateTotal(this.playerHand);
    this.drawCards();
    
    if (this.playerTotal > 21) {
      this.endHand('BUST! YOU LOSE', 0);
    }
  }
  
  stand() {
    this.dealerTurn();
  }
  
  doubleDown() {
    if (this.chips < this.bet) return;
    
    this.chips -= this.bet;
    this.bet *= 2;
    this.chipsText.setText(`CHIPS: ${this.chips}`);
    this.betText.setText(`BET: ${this.bet}`);
    
    this.playerHand.push(this.deck.deal());
    this.playerTotal = this.calculateTotal(this.playerHand);
    this.drawCards();
    
    if (this.playerTotal > 21) {
      this.endHand('BUST! YOU LOSE', 0);
    } else {
      this.dealerTurn();
    }
  }
  
  dealerTurn() {
    this.canAct = false;
    this.hitBtn.setVisible(false);
    this.standBtn.setVisible(false);
    this.doubleBtn.setVisible(false);
    
    this.drawCards();
    
    const drawLoop = () => {
      if (this.dealerTotal < 17) {
        this.time.delayedCall(500, () => {
          this.dealerHand.push(this.deck.deal());
          this.dealerTotal = this.calculateTotal(this.dealerHand);
          this.drawCards();
          drawLoop();
        });
      } else {
        this.determineWinner();
      }
    };
    
    this.time.delayedCall(500, drawLoop);
  }
  
  determineWinner() {
    this.gameOver = true;
    
    if (this.dealerTotal > 21) {
      this.endHand('DEALER BUSTS! YOU WIN!', this.bet * 2);
    } else if (this.dealerTotal > this.playerTotal) {
      this.endHand('DEALER WINS', 0);
    } else if (this.playerTotal > this.dealerTotal) {
      this.endHand('YOU WIN!', this.bet * 2);
    } else {
      this.endHand('PUSH - BET RETURNED', this.bet);
    }
  }
  
  endHand(message, payout) {
    this.msgText.setText(message);
    this.chips += payout;
    this.chipsText.setText(`CHIPS: ${this.chips}`);
    this.bet = 10;
    this.betText.setText(`BET: ${this.bet}`);
    
    this.time.delayedCall(2000, () => {
      this.canAct = false;
      this.dealState = true;
      this.playerHand = [];
      this.dealerHand = [];
      this.drawCards();
      this.dealBtn.setVisible(true);
      this.hitBtn.setVisible(false);
      this.standBtn.setVisible(false);
      this.doubleBtn.setVisible(false);
      this.msgText.setText('');
    });
  }
  
  actionZ() {
    const now = this.time.now;
    if (now - this.lastInput < 300) return;
    this.lastInput = now;
    
    if (this.gameState === 'explore') {
      this.interact();
    } else if (this.gameState === 'casino') {
      this.interactCasino();
    } else if (this.gameState === 'blackjack') {
      if (this.dealState) {
        this.deal();
      } else if (this.canAct) {
        this.hit();
      }
    }
  }
  
  actionX() {
    const now = this.time.now;
    if (now - this.lastInput < 300) return;
    this.lastInput = now;
    
    if (this.gameState === 'blackjack') {
      if (this.canAct) {
        this.stand();
      } else if (!this.dealState && !this.gameOver) {
        // Can't exit mid-hand
      } else {
        this.backToCasino();
      }
    }
  }
  
  actionC() {
    if (this.gameState === 'blackjack' && this.canAct) {
      this.doubleDown();
    }
  }
  
  interact() {
    const px = this.player.x;
    const py = this.player.y;
    
    if (px > 160 && px < 288 && py > 96 && py < 176) {
      this.gameState = 'casino';
      this.scene.restart();
    }
  }
  
  interactCasino() {
    const px = this.player.x;
    const py = this.player.y;
    
    const dist = Phaser.Math.Distance.Between(px, py, 15 * 16 * SCALE + 16, 11 * 16 * SCALE);
    if (dist < 80 && this.dealState) {
      this.gameState = 'blackjack';
      this.scene.restart();
    }
    
    if (py > 15 * 16 * SCALE) {
      this.exitCasino();
    }
  }
  
  exitCasino() {
    this.gameState = 'explore';
    this.player.x = 14 * 16 * SCALE + 16;
    this.player.y = 14 * 16 * SCALE;
    this.scene.restart();
  }
  
  backToCasino() {
    if (this.chips <= 0) {
      this.chips = 100;
      this.bet = 10;
    }
    this.gameState = 'casino';
    this.scene.restart();
  }
  
  update() {
    const speed = 120;
    
    if (this.gameState === 'explore' && this.player) {
      this.player.body.setVelocity(0);
      
      if (this.cursors.left.isDown) this.player.body.setVelocityX(-speed);
      else if (this.cursors.right.isDown) this.player.body.setVelocityX(speed);
      
      if (this.cursors.up.isDown) this.player.body.setVelocityY(-speed);
      else if (this.cursors.down.isDown) this.player.body.setVelocityY(speed);
    }
    
    if (this.gameState === 'casino' && this.player) {
      this.player.body.setVelocity(0);
      
      if (this.cursors.left.isDown) this.player.body.setVelocityX(-speed);
      else if (this.cursors.right.isDown) this.player.body.setVelocityX(speed);
      
      if (this.cursors.up.isDown) this.player.body.setVelocityY(-speed);
      else if (this.cursors.down.isDown) this.player.body.setVelocityY(speed);
    }
  }
}

// ============================================
// GAME CONFIG
// ============================================
const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 320,
  parent: 'game-container',
  pixelArt: true,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: MainScene,
};

const game = new Phaser.Game(config);
