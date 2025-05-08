const gameState = {
    isGameActive: false,
    currentGame: null,
    players: new Map(),
    
    reset() {
        this.isGameActive = false;
        this.currentGame = null;
        this.players.clear();
    }
};

module.exports = { gameState };
