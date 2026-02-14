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
    this.suit = suit; // 'hearts', 'diamonds', 'clubs', 'spades'
    this.rank = rank; // 1-13 (A, 2-10, J, Q, K)
    this.faceUp = false;
  }
  
  get value() {
    if (this.rank === 1) return 11; // Ace
    if (this.rank > 10) return 10; // J, Q, K
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
    this.gameState = 'explore'; // explore, casino, blackjack
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
  }
  
  preload() {
    // Generate pixel textures programmatically
    this.generateTextures();
  }
  
  generateTextures() {
    // Player sprite (16x16, scaled 2x)
    const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Body
    playerGfx.fillStyle(0xc9a227); // Gold/tan
    playerGfx.fillRect(8, 4, 8, 10);
    // Head
    playerGfx.fillStyle(0xf5d0a9); // Skin
    playerGfx.fillRect(9, 0, 6, 5);
    // Hair
    playerGfx.fillStyle(0x4a3728); // Brown
    playerGfx.fillRect(9, 0, 6, 2);
    playerGfx.generateTexture('player', 16, 16);
    
    // Grass tile
    const grassGfx = this.make.graphics({ x: 0, y: 0, add: false });
    grassGfx.fillStyle(0x3d6b3d);
    grassGfx.fillRect(0, 0, 16, 16);
    grassGfx.fillStyle(0x4a7c4a);
    grassGfx.fillRect(2, 2, 2, 2);
    grassGfx.fillRect(10, 8, 2, 2);
    grassGfx.fillRect(6, 12, 2, 2);
    grassGfx.generateTexture('grass', 16, 16);
    
    // Floor tile
    const floorGfx = this.make.graphics({ x: 0, y: 0, add: false });
    floorGfx.fillStyle(0x8b7355);
    floorGfx.fillRect(0, 0, 16, 16);
    floorGfx.fillStyle(0x9c8465);
    floorGfx.fillRect(0, 0, 16, 2);
    floorGfx.fillRect(0, 14, 16, 2);
    floorGfx.generateTexture('floor', 16, 16);
    
    // Wall tile
    const wallGfx = this.make.graphics({ x: 0, y: 0, add: false });
    wallGfx.fillStyle(0x5c4033);
    wallGfx.fillRect(0, 0, 16, 16);
    wallGfx.fillStyle(0xc9a227);
    wallGfx.fillRect(0, 14, 16, 2);
    wallGfx.generateTexture('wall', 16, 16);
    
    // Table
    const tableGfx = this.make.graphics({ x: 0, y: 0, add: false });
    tableGfx.fillStyle(0x4a1c6b);
    tableGfx.fillRect(0, 0, 48, 32);
    tableGfx.fillStyle(0xc9a227);
    tableGfx.fillRect(0, 0, 48, 2);
    tableGfx.fillRect(0, 30, 48, 2);
    tableGfx.generateTexture('table', 48, 32);
    
    // Card back
    const cardBack = this.make.graphics({ x: 0, y: 0, add: false });
    cardBack.fillStyle(0x1a1a6b);
    cardBack.fillRect(0, 0, 20, 28);
    cardBack.fillStyle(0xc9a227);
    cardBack.fillRect(2, 2, 16, 24);
    cardBack.generateTexture('cardBack', 20, 28);
    
    // NPC (dealer)
    const npcGfx = this.make.graphics({ x: 0, y: 0, add: false });
    npcGfx.fillStyle(0x1a1a2e); // Dark suit
    npcGfx.fillRect(8, 4, 8, 10);
    npcGfx.fillStyle(0xf5d0a9); // Skin
    npcGfx.fillRect(9, 0, 6, 5);
    npcGfx.fillStyle(0x1a1a1a); // Hair
    npcGfx.fillRect(9, 0, 6, 2);
    npcGfx.generateTexture('dealer', 16, 16);
    
    // Door
    const doorGfx = this.make.graphics({ x: 0, y: 0, add: false });
    doorGfx.fillStyle(0x5c4033);
    doorGfx.fillRect(0, 0, 24, 32);
    doorGfx.fillStyle(0xc9a227);
    doorGfx.fillRect(2, 2, 20, 28);
    doorGfx.fillStyle(0x8b7355);
    doorGfx.fillCircle(18, 16, 2);
    doorGfx.generateTexture('door', 24, 32);
    
    // Sign
    const signGfx = this.make.graphics({ x: 0, y: 0, add: false });
    signGfx.fillStyle(0x5c4033);
    signGfx.fillRect(6, 0, 4, 16);
    signGfx.fillStyle(0xc9a227);
    signGfx.fillRect(0, 16, 32, 16);
    signGfx.fillStyle(0x1a1a2e);
    signGfx.fillRect(2, 18, 28, 12);
    signGfx.generateTexture('sign', 32, 32);
  }
  
  create() {
    // Setup
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    if (this.gameState === 'explore') {
      this.createOverworld();
    } else if (this.gameState === 'casino') {
      this.createCasino();
    } else if (this.gameState === 'blackjack') {
      this.createBlackjack();
    }
  }
  
  createOverworld() {
    // Ground
    for (let x = 0; x < 30; x++) {
      for (let y = 0; y < 20; y++) {
        this.add.image(x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, 'grass').setScale(SCALE);
      }
    }
    
    // Casino building (center)
    for (let x = 10; x < 18; x++) {
      for (let y = 6; y < 12; y++) {
        const tx = x * TILE_SIZE * SCALE;
        const ty = y * TILE_SIZE * SCALE;
        if (y === 11) {
          this.add.image(tx, ty, 'floor').setScale(SCALE);
        } else {
          this.add.image(tx, ty, 'wall').setScale(SCALE);
        }
      }
    }
    
    // Door
    this.add.image(13 * TILE_SIZE * SCALE, 11 * TILE_SIZE * SCALE, 'door').setScale(SCALE);
    
    // Sign
    this.add.image(14 * TILE_SIZE * SCALE, 4 * TILE_SIZE * SCALE, 'sign').setScale(SCALE);
    
    // Sign text
    const signText = this.add.text(14 * TILE_SIZE * SCALE, 3.5 * TILE_SIZE * SCALE, 'ALEA', {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#c9a227',
    }).setOrigin(0.5);
    
    // Decorations - trees
    for (let i = 0; i < 5; i++) {
      const tx = Phaser.Math.Between(1, 5) * TILE_SIZE * SCALE;
      const ty = Phaser.Math.Between(1, 5) * TILE_SIZE * SCALE;
      if (tx > 8 * TILE_SIZE * SCALE && ty < 8 * TILE_SIZE * SCALE) continue;
      this.add.rectangle(tx, ty, 16 * SCALE, 24 * SCALE, 0x2d5a2d).setOrigin(0.5, 1);
    }
    
    // Player
    this.player = this.physics.add.sprite(14 * TILE_SIZE * SCALE, 14 * TILE_SIZE * SCALE, 'player');
    this.player.setScale(SCALE);
    this.player.setCollideWorldBounds(true);
    
    // Colliders
    // Casino walls
    this.physics.add.existing(this.add.rectangle(14 * 16 * SCALE, 9 * 16 * SCALE, 8 * 16 * SCALE, 2 * 16 * SCALE, 0x000000, 0));
    
    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-Z', this.interact, this);
    this.input.keyboard.on('keydown-ENTER', this.interact, this);
    
    // UI
    this.add.text(8, 8, 'ARROWS: Move  Z: Enter', {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#c9a227',
    });
  }
  
  createCasino() {
    // Floor
    for (let x = 0; x < 30; x++) {
      for (let y = 0; y < 20; y++) {
        this.add.image(x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, 'floor').setScale(SCALE);
      }
    }
    
    // Walls
    for (let x = 0; x < 30; x++) {
      this.add.image(x * TILE_SIZE * SCALE, 2 * TILE_SIZE * SCALE, 'wall').setScale(SCALE);
      this.add.image(x * TILE_SIZE * SCALE, 17 * TILE_SIZE * SCALE, 'wall').setScale(SCALE);
    }
    for (let y = 2; y < 18; y++) {
      this.add.image(2 * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, 'wall').setScale(SCALE);
      this.add.image(27 * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, 'wall').setScale(SCALE);
    }
    
    // Exit door
    this.exitDoor = this.add.rectangle(15 * 16 * SCALE, 17 * 16 * SCALE - 4, 48, 4, 0xc9a227).setOrigin(0.5);
    
    // Blackjack table (center)
    this.add.image(15 * TILE_SIZE * SCALE, 10 * TILE_SIZE * SCALE, 'table').setScale(SCALE * 2);
    
    // Dealer
    this.dealer = this.add.image(15 * TILE_SIZE * SCALE, 6 * TILE_SIZE * SCALE, 'dealer').setScale(SCALE * 2);
    
    // "Play" prompt
    this.playPrompt = this.add.text(15 * TILE_SIZE * SCALE, 14 * TILE_SIZE * SCALE, '[Z] Play Blackjack', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
      backgroundColor: '#1a1a2e',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    
    // Chip display
    this.add.text(4 * SCALE, 4 * SCALE, `CHIPS: ${this.chips}`, {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#c9a227',
    });
    
    // Player
    this.player = this.physics.add.sprite(15 * TILE_SIZE * SCALE, 14 * TILE_SIZE * SCALE, 'player');
    this.player.setScale(SCALE);
    this.player.setCollideWorldBounds(true);
    
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-Z', this.interactCasino, this);
    this.input.keyboard.on('keydown-ENTER', this.interactCasino, this);
    this.input.keyboard.on('keydown-X', this.exitCasino, this);
    
    // Instructions
    this.add.text(4 * SCALE, 296 * SCALE, 'Z: Interact  X: Exit', {
      fontFamily: 'Press Start 2P',
      fontSize: '6px',
      color: '#888',
    });
  }
  
  createBlackjack() {
    // Casino background
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Felt table
    const felt = this.add.graphics();
    felt.fillStyle(0x0a4a0a);
    felt.fillRoundedRect(40, 40, 400, 240, 16);
    felt.lineStyle(4, 0xc9a227);
    felt.strokeRoundedRect(40, 40, 400, 240, 16);
    
    // Dealer area
    this.add.text(220, 50, 'DEALER', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    }).setOrigin(0.5);
    
    // Player area
    this.add.text(220, 180, 'YOUR HAND', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    }).setOrigin(0.5);
    
    // Bet display
    this.betText = this.add.text(80, 260, `BET: ${this.bet}`, {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    });
    
    // Chips display
    this.chipsText = this.add.text(300, 260, `CHIPS: ${this.chips}`, {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
    });
    
    // Deal button (as text)
    this.dealBtn = this.add.text(200, 250, '[Z] DEAL', {
      fontFamily: 'Press Start 2P',
      fontSize: '12px',
      color: '#c9a227',
      backgroundColor: '#1a1a2e',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    
    // Action buttons (hidden initially)
    this.hitBtn = this.add.text(100, 250, '[Z] HIT', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#228b22',
      backgroundColor: '#1a1a2e',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setVisible(false);
    
    this.standBtn = this.add.text(200, 250, '[X] STAND', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      fontSize: '10px',
      color: '#c41e3a',
      backgroundColor: '#1a1a2e',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setVisible(false);
    
    this.doubleBtn = this.add.text(300, 250, '[C] DOUBLE', {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: '#c9a227',
      backgroundColor: '#1a1a2e',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setVisible(false);
    
    // Message text
    this.msgText = this.add.text(240, 130, '', {
      fontFamily: 'Press Start 2P',
      fontSize: '12px',
      color: '#f5e6c8',
      align: 'center',
    }).setOrigin(0.5);
    
    // Back button
    this.backBtn = this.add.text(400, 20, '[X] Exit', {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#888',
    });
    
    // Setup controls
    this.input.keyboard.on('keydown-Z', this.actionZ, this);
    this.input.keyboard.on('keydown-X', this.actionX, this);
    this.input.keyboard.on('keydown-C', this.actionC, this);
    this.input.keyboard.on('keydown-ENTER', this.actionZ, this);
    
    // Initial state
    this.dealState = true;
    this.drawCards();
  }
  
  drawCards() {
    // Clear existing card sprites
    if (this.cardSprites) {
      this.cardSprites.destroy();
    }
    this.cardSprites = this.add.group();
    
    // Draw player cards
    let x = 120;
    for (let i = 0; i < this.playerHand.length; i++) {
      const card = this.playerHand[i];
      this.drawCard(x, 200, card, i < 2 || this.canAct);
      x += 35;
    }
    
    // Draw dealer cards
    x = 120;
    for (let i = 0; i < this.dealerHand.length; i++) {
      const card = this.dealerHand[i];
      if (i === 1 && !this.canAct) {
        // Face down
        this.add.image(x, 80, 'cardBack').setScale(SCALE);
      } else {
        this.drawCard(x, 80, card, true);
      }
      x += 35;
    }
    
    // Update totals
    if (this.canAct || this.gameOver) {
      this.add.text(300, 90, `${this.dealerTotal}`, {
        fontFamily: 'Press Start 2P',
        fontSize: '14px',
        color: '#f5e6c8',
      });
    }
    
    this.add.text(300, 210, `${this.playerTotal}`, {
      fontFamily: 'Press Start 2P',
      fontSize: '14px',
      color: '#f5e6c8',
    });
  }
  
  drawCard(x, y, card, faceUp) {
    if (!faceUp) {
      this.add.image(x, y, 'cardBack').setScale(SCALE);
      return;
    }
    
    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0xfffef0);
    bg.fillRoundedRect(x - 10, y - 14, 20, 28, 2);
    bg.lineStyle(1, 0xcccccc);
    bg.strokeRoundedRect(x - 10, y - 14, 20, 28, 2);
    
    // Suit color
    const color = card.isRed ? '#d42020' : '#1a1a1a';
    
    // Rank
    this.add.text(x - 6, y - 8, card.displayRank, {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: color,
    });
    
    // Suit symbol
    this.add.text(x, y + 2, card.displaySuit, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: color,
    }).setOrigin(0.5);
    
    // Corner rank
    this.add.text(x - 6, y + 6, card.displayRank, {
      fontFamily: 'Press Start 2P',
      fontSize: '6px',
      color: color,
    }).setOrigin(0.5, 0);
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
    
    // Hide deal button, show action buttons
    this.dealBtn.setVisible(false);
    this.hitBtn.setVisible(true);
    this.standBtn.setVisible(true);
    this.doubleBtn.setVisible(true);
    this.doubleBtn.setAlpha(this.chips >= this.bet ? 1 : 0.5);
    
    // Check for blackjack
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
    
    // Reveal dealer card
    this.drawCards();
    
    // Dealer draws
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
    // Check if near casino door
    const px = this.player.x;
    const py = this.player.y;
    
    if (px > 10 * 16 * SCALE && px < 18 * 16 * SCALE && 
        py > 8 * 16 * SCALE && py < 14 * 16 * SCALE) {
      this.gameState = 'casino';
      this.scene.restart();
    }
  }
  
  interactCasino() {
    const px = this.player.x;
    const py = this.player.y;
    
    // Check distance to table
    const dist = Phaser.Math.Distance.Between(px, py, 15 * 16 * SCALE, 11 * 16 * SCALE);
    if (dist < 80 && this.dealState) {
      this.gameState = 'blackjack';
      this.scene.restart();
    }
    
    // Exit
    if (py > 15 * 16 * SCALE) {
      this.exitCasino();
    }
  }
  
  exitCasino() {
    this.gameState = 'explore';
    this.player.x = 14 * 16 * SCALE;
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
    if (this.gameState === 'explore' && this.player) {
      const speed = 120;
      this.player.setVelocity(0);
      
      if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
      else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
      
      if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
      else if (this.cursors.down.isDown) this.player.setVelocityY(speed);
    }
    
    if (this.gameState === 'casino' && this.player) {
      const speed = 120;
      this.player.setVelocity(0);
      
      if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
      else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
      
      if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
      else if (this.cursors.down.isDown) this.player.setVelocityY(speed);
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
