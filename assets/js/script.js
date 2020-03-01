/**
 * 2D vectors for 8 possible directions.
 * @enum {number, number}
 */
const CompassEnum = {
    N: 0,
    NE: 1,
    E: 2,
    SE: 3,
    S: 4,
    SW: 5,
    W: 6,
    NW: 7,
    basis: {
        0: { dy: -1, dx: 0 },
        1: { dy: -1, dx: 1 },
        2: { dy: 0, dx: 1 },
        3: { dy: 1, dx: 1 },
        4: { dy: 1, dx: 0 },
        5: { dy: 1, dx: -1 },
        6: { dy: 0, dx: -1 },
        7: { dy: -1, dx: -1 },
    },
};

/**
 * Colors for squares.
 * @enum {string}
 */
const PlayerColorEnum = {
    UNOCCUPIED: 0,
    PLAYER1: 1,
    PLAYER2: 2,
    color: {
        0: "green",
        1: "black",
        2: "white",
    },
};

/**
 * Minimal and maximal levels of AI.
 * @enum {number}
 */
const AiLevelEnum = {
    MIN: 1, //minimal AI level
    MAX: 2, //maximal AI level
};

if (Object.freeze) {
    Object.freeze(CompassEnum);
    Object.freeze(PlayerColorEnum);
    Object.freeze(AiLevelEnum);
}

/**
 * Calculates the opponent player number.
 * @param {number} player
 * @return {number} The opponent player number.
 */
function opponent(player) {
    return player % 2 + 1;
}

/**
 * Extracts coordinates of a square form an array containing its classes.
 * @param {!Array<string>} inputClasses
 * @return {!ObjType<Square>} An object with coordinates of the square.
 */
function readCoordinates(inputClasses) {
    let output = new Square(0, 0);
    for (let i of inputClasses) {
        if (i.length == 2) {
            let inputAxis = i[0];
            if (inputAxis == "x" || inputAxis == "y") {
                let coordinate = parseInt(i[1]);
                if (Number.isInteger(coordinate) && coordinate > -1 && coordinate < 8) {
                    output[inputAxis] = coordinate;
                }
            }
        }
    }
    return output;
}

/**
 * A pair of coordinates (y,x) for a square.
 */
class Square {
    /**
     * @param {number} y The vertical coordinate (0 - top, 7 -bottom).
     * @param {number} x The horizontal coordinate (0 - left, 7 -right).
     */
    constructor(y, x) {
        this.y = y;
        this.x = x;
    }

    /**
     * Sets the color of a square with coordinates (y,x) to a new color.
     * @param {string} newColor The new color ("black" or "white").
     */
    setNewColor(newColor) {
        let selector = `.y${this.y}.x${this.x}`;
        $(selector).removeClass("bg-white");
        $(selector).removeClass("bg-black");
        $(selector).removeClass("bg-green");
        $(selector).addClass("bg-" + newColor);
    }

    /**
     * Shifts coordinates of a square on the classic board by a vector.
     * @param {!ObjType<Vector>} shift The shift vector.
     * @return {boolean} False if the result is out of the board, true otherwise.
     */
    classicShiftBy(shift) {
        this.y = this.y + shift.dy;
        this.x = this.x + shift.dx;
        if (this.y < 0 || this.y > 7 || this.x < 0 || this.x > 7) {
            // Return a negative flag (the claculated square is out of board).
            return false;
        } else {
            // Return a positive flag (the claculated square is within board).
            return true;
        }
    }

    /**
     * Shifts coordinates of a square on the toroid board by a vector.
     * @param {!ObjType<Vector>} shift The shift vector.
     */
    toroidShiftBy(shift) {
        this.y = (this.y + shift.dy + 8) % 8;
        this.x = (this.x + shift.dx + 8) % 8;
    }
}

/**
 * A pair of components (dy,dx) for a vector.
 */
class Vector {
    /**
     * @param {number} dy The vertical component (0 - top, 7 -bottom).
     * @param {number} dx The horizontal component (0 - left, 7 -right).
     */
    constructor(dy, dx) {
        this.dy = dy;
        this.dx = dx;
    }
}

/**
 * A game map with flags.
 */
class Map {
    /**
     * Creates and initializes a map.
     * @param {boolean} isClassic The classical board flag: true - classic, false - toroid.
     * @param {string} typeOfMap The map type:
     *     "current" - empty or occupied squares,
     *     "permitted" - squares permitted for a move, or occupied, or empty non-permitted.
     */
    constructor(isClassic, typeOfMap) {
        this.isClassic = isClassic;
        this.type = typeOfMap;
        this.map = [];
        // Create an array and initialize all its elements to 0.
        for (let i = 0; i < 8; i++) {
            let mapRow = [];
            for (let j = 0; j < 8; j++) {
                mapRow[j] = 0;
            }
            this.map[i] = mapRow;
        }
        // For "current" map set initial position: 2 black and 2 white squares.
        if (typeOfMap == "current") {
            this.map[3][3] = 1; this.map[3][4] = 2;
            this.map[4][3] = 2; this.map[4][4] = 1;
        }
        // For "permitted" map set initial position: inner 2x2 squares are occupied (=2), their neighbours are permitted (=1).
        if (typeOfMap == "permitted") {
            this.map[2][2] = 1; this.map[2][3] = 1; this.map[2][4] = 1; this.map[2][5] = 1;
            this.map[3][2] = 1; this.map[3][3] = 2; this.map[3][4] = 2; this.map[3][5] = 1;
            this.map[4][2] = 1; this.map[4][3] = 2; this.map[4][4] = 2; this.map[4][5] = 1;
            this.map[5][2] = 1; this.map[5][3] = 1; this.map[5][4] = 1; this.map[5][5] = 1;
        }
        this.potentialGains = [];
        this.totalPotentialGain = 0;
    }

    /**
     * Calculates gains in 8 possible directions and the total gain if "player" clicks "square".
     * @param {!ObjType<Square>} square The clicked square.
     * @param {number} player The player that makes a move.
     * @return {number} Total potential gain.
     */
    calculateGain(square, player) {
        let output = [];
        for (let i = 0; i < 8; i++) {
            let dir = new Vector(CompassEnum.basis[i].dy, CompassEnum.basis[i].dx);
            let bufferSquare = new Square(square.y, square.x);
            for (let j = 1; j < 8; j++) {
                if (this.isClassic) { // If the map is classic...
                    // If the terminal square is out of the board then gain in this direction is 0.
                    if (!bufferSquare.classicShiftBy(dir)) {
                        output.push(0);
                        break;
                    }
                } else { // If the map to be updates is toroid...
                    bufferSquare.toroidShiftBy(dir);
                }
                // If the terminal square is empty then gain in this direction is 0
                if (this.map[bufferSquare.y][bufferSquare.x] == 0) {
                    output.push(0);
                    break;
                }
                // If the terminal square is of own color then calcute the gain in this direction.
                if (this.map[bufferSquare.y][bufferSquare.x] == player) {
                    output.push(j - 1);
                    break;
                }
            }
        }
        this.potentialGains = output;
        this.totalPotentialGain = this.potentialGains.reduce((a, b) => a + b, 0);
        return this.totalPotentialGain;
    }

    /**
     * Updates a map when "player" clicks "square".
     * @param {!ObjType<Square>} square The clicked square.
     * @param {number} player The player that makes a move.
     */
    updateMap(square, player) {
        let bufferSquare = new Square(0, 0);
        if (this.type == "current") { // If the map to be updates is current...
            // Update color of "square".
            this.map[square.y][square.x] = player;
            // Reverse color of the opponent's squares.
            for (let i = 0; i < 8; i++) {
                if (this.potentialGains[i] > 0) {
                    let dir = CompassEnum.basis[i];
                    // Initialize the buffer square.
                    Object.assign(bufferSquare, square);
                    for (let j = 0; j < this.potentialGains[i]; j++) {
                        bufferSquare.toroidShiftBy(dir);
                        // Update color of the bufferSquare.
                        this.map[bufferSquare.y][bufferSquare.x] = player;
                    }
                }
            }
        }
        if (this.type == "permitted") { // If the map to be updates is permitted...
            // Mark "square" as occupied.
            this.map[square.y][square.x] = 2;
            // Check all squares aroung "square".
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    // Calculate coordinates of a neighbour square.
                    Object.assign(bufferSquare, square);
                    let shift = new Vector(i, j);
                    if (this.isClassic) {
                        if (!bufferSquare.classicShiftBy(shift)) {
                            continue;
                        }
                    } else {
                        bufferSquare.toroidShiftBy(shift);
                    }
                    // If a neighbour square was unoccupied then mark it as permitted.
                    if (this.map[bufferSquare.y][bufferSquare.x] == 0) {
                        this.map[bufferSquare.y][bufferSquare.x] = 1;
                    }
                }
            }
        }
    }
}

/**
 * A class with the 2 game maps.
 */
class Maps {
    /**
     * Creates and initializes 2 game maps.
     * @param {boolean} isClassic The classical board flag: true - classic, false - toroid.
     */
    constructor(isClassic) {
        this.current = new Map(isClassic, "current");
        this.permitted = new Map(isClassic, "permitted");
    }

    /**
     * Checks whether "player" can move.
     * @param {number} player The player.
     * @return {boolean} True if player can move, false if player cannot move.
     */
    canPlayerMove(player) {
        let reply = false;
        for (let i = 0; i < 8; i++) {
            if (reply) {
                break;
            }
            for (let j = 0; j < 8; j++) {
                if (this.permitted.map[i][j] != 1) {
                    continue;
                }
                if (this.current.calculateGain(new Square(i, j), player) > 0) {
                    reply = true;
                    break;
                }
            }
        }
        return reply;
    }

    /**
     * Updates colors on the game board according to the current map.
     * @param {!ObjType<Square>} square The clicked square.
     * @param {number} player The player that makes a move.
     */
    updateGameBoard() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                let bufferSquare = new Square(i, j);
                let newColor = PlayerColorEnum.color[this.current.map[i][j]];
                bufferSquare.setNewColor(newColor);
            }
        }
    }


}

/**
 * A class with infomation about players.
 */
class Players {
    /**
     * Creates and initializes players' data.
     */
    constructor() {
        this.isHuman = [false, true, true]; // {!Array<boolean>}: [unused, Player 1 is human, Player 2 is human].
        this.name = ["", "Player1", "Player2"]; // {!Array<string>}: [unused, name of player 1, name of player 2].
        this.current = 0; // {number} Current player to move: 0 - empty, 1 - black, 2 - white.
        this.aiLevel = 0; // {number} AI level: must be either 1, or 2; level 0 is default for no AI player.
        this.changeNameOfPlayer = 0; // {number} Number of the player which is going to change its name.
    }

    /**
     * Returns the current player's color.
     * @return {string} The color.
     */
    getCurrentColor() {
        return PlayerColorEnum.color[this.current];
    }

    /**
     * Passes the move to the opponent player.
     */
    passMove() {
        this.current = opponent(this.current);
    }

    /**
     * Analylizes the string in input field and either displays an alert or sets name, isHuman, aiLevel to proper values.
     * @param {string} name The possible new name (from input field).
     * @param {number} player The player whose name needs to be changed.
     * @return {boolean} True if everything is OK, false if the new name was not valid.
     */
    setNewName(name) {
        let player = this.changeNameOfPlayer;
        // Analyzes the entered new name.
        let newNameStartsWith = name.slice(0, 10);
        // Checks whether the new name starts as a correct "AI-name": "AI (level ".
        if (newNameStartsWith == "AI (level ") {
            let newNameEndsWith = name.slice(11, 12);
            // Displays an alert if the new name starts as a correct "AI-name" but doesn't end as one.
            if (newNameEndsWith != ')') {
                alert(`The AI level looks strange. It MUST be not lower than ${AiLevelEnum.MIN} and no higher than ${AiLevelEnum.MAX}.`);
                return false;
            }
            // Displays an alert if the user tries to switch both players to AI.
            if (!this.isHuman[opponent(player)]) {
                alert("At present there MUST be at least 1 HUMAN player");
                return false;
            } else {
                let newAiLevel = name.charCodeAt(10) - 48;
                // Displays an alert if the chosen AI level is not supported yet.
                if (newAiLevel < AiLevelEnum.MIN || newAiLevel > AiLevelEnum.MAX) {
                    alert(`At present minimal AI level is ${AiLevelEnum.MIN} and maximal is ${AiLevelEnum.MAX}. While you try to set it to ${newAiLevel}.`);
                    return false;
                } else { // If the new name is a correct "AI-name"...
                    this.isHuman[player] = false;
                    this.aiLevel = newAiLevel;
                }
            }
        } else { // If the new name is a "human" name...
            this.isHuman[player] = true;
        }
        // Sets the new name (maximal length is 12 symbols, the longer names are truncated).
        if (name.length > 12) {
            alert("Names may not be longer than 12 symbols.");
        }
        this.name[player] = name.slice(0, 12);
        // Returns that everything is OK.
        return true;
    }
}

/**
 * A class for a board (below the game board) that displays the players' current scores.
 */
class ScoreBoard {
    /**
     * Creates and initializes scores.
     */
    constructor() {
        this.score = [0, 2, 2,];// {!Array<number>}: [unused, score of Player 1,  score of Player 2].
    }

    /**
     * Displays the current score.
     * @param {!Array<string>} name An array with players' names.
     * @return {boolean} True if everything is OK, false if the new name was not valid.
     */
    displayScore(name) {
        for (let i = 1; i < 3; i++) {
            $(`#player${i} > .score`).text(this.score[i]);
            $(`#player${i} > .name`).text(name[i]);
        }
    }

    /**
     * Analylizes players' score and returns true if Player 1 wins.
     * @return {boolean} True if Player 1 wins, false otherwise.
     */
    player1Wins() {
        return this.score[1] > this.score[2];
    }

    /**
     * Analylizes players' score and returns true if Player 2 wins.
     * @return {boolean} True if Player 2 wins, false otherwise.
     */
    player2Wins() {
        return this.score[1] < this.score[2];
    }

    /**
     * Updates the current score.
     * @param {number} change The gain of the current player (and loss of the opponent).
     * @param {number} player The current player's number.
     */
    updateScore(change, player) { // Function updates the score.
        switch (player) {
            case 1:
                this.score[1] += change + 1;
                this.score[2] -= change;
                break;
            case 2:
                this.score[2] += change + 1;
                this.score[1] -= change;
                break;
        }
    }
};

/**
 * A class for a message board (below the score board) that displays various messages.
 */
class Message {
    /**
     * Creates and initializes message properties.
     */
    constructor() {
        this.html = "#message-content"; // Selector for the message section.
        this.oldMessage = ""; // A buffer for storage of an old message.
    }
};

/**
 * The main class containing other classes and methods that use several of the subclasses.
 */
class Game {
    /**
     * Creates and initializes 4 game objects.
     * @param {boolean} isClassic The classical board flag: true - classic, false - toroid.
     */
    constructor(isClassic) {
        this.players = new Players();
        this.maps = new Maps(isClassic);
        this.scoreBoard = new ScoreBoard();
        this.message = new Message();
    }

    /**
     * Finishes the move after the current player moves to "square" which results in "scoreChange".
     * @param {!ObjType<Square>} square The clicked square.
     * @param {number} scoreChange Gain of the current player (and loss of the opponent).
     */
    finishMove(square, scoreChange) {
        this.scoreBoard.updateScore(scoreChange, this.players.current); // Updates the score.
        this.scoreBoard.displayScore(this.players.name); // Displays the score.
        this.maps.current.updateMap(square, this.players.current); // Updates "current" map.
        this.maps.permitted.updateMap(square, this.players.current);  // Updates "permitted" map.
        this.maps.updateGameBoard(); // Updates colors on the board according to "current" map.
        this.makeNextMove(); // Passes move to the opponent player.
    }

    /**
     * Finishes the attempt to set a new name for a player (when the user clicked "OK").
     */
    finishSettingNewName() {
        // Tries to set the new name.
        let newName = $("#new-name").val();
        this.players.setNewName(newName);
        // Restores the message about the player to move.
        $(this.message.html).html(this.message.oldMessage);
        this.updateMessage();
        // Saves the new name and restores current message
        this.scoreBoard.displayScore(this.players.name);
        $("#new-player").hide();
        // If the name of the current player is changed then make the player move by 1) passing the move to opponent and 2) making the next move. 
        if (this.players.changeNameOfPlayer == this.players.current) {
            this.players.passMove();
            this.makeNextMove();
        }
    }

    /**
     * Displays the game's result When the game is over.
     */
    gameResult() {
        let winMessage = "DRAW";
        if (this.scoreBoard.player1Wins()) {
            winMessage = `${this.players.name[1]} (${PlayerColorEnum.color[1]}) WON!!!`;
        }
        if (this.scoreBoard.player2Wins()) {
            winMessage = `${this.players.name[2]} (${PlayerColorEnum.color[2]}) WON!!!`;
        }
        $(this.message.html).html(winMessage);
    }

    /**
     * Initializes a game.
     * @param {string} headerText The header: "Classic reversi" or "Reversi-on-Toroid".
     */
    initializeGame(headerText) {
        $("#play > h3").text(headerText);
        $("#welcome").hide();
        $("#play").show();
        this.scoreBoard.displayScore(this.players.name);
        this.makeNextMove();
        this.maps.updateGameBoard();
    }

    /**
     * Checks whether players can make one more move.
     */
    makeNextMove() {
        let nextPlayer = opponent(this.players.current);
        let opponentPlayerCanMove = this.maps.canPlayerMove(nextPlayer);
        if (opponentPlayerCanMove) { // If the opponent player can move...
            this.players.passMove();
            this.updateMessage();
            this.potentialAiMove(); // Tries to move for the AI.
        } else {
            let nextPlayer = this.players.current;
            let currentPlayerCanMove = this.maps.canPlayerMove(nextPlayer);
            if (currentPlayerCanMove) { // If the opponent player cannot move but the current player can move again...
                this.moveAgain();
                this.potentialAiMove();// Tries to move for the AI.
            } else {
                this.gameResult(); // If neither player can move then display the game result message.
            }
        }
    }

    /**
     * Displays a message that the current player can move again.
     */
    moveAgain() {
        $(this.message.html).html(`Move of Player${this.players.current} (${this.players.getCurrentColor()}) again!`);
    }

    /**
     * Makes a move if the curent player is AI.
     */
    potentialAiMove() {
        // If the current player is human then exits without doing anything.
        if (this.players.isHuman[this.players.current]) {
            return;
        }
        // Makes a move for AI player.
        let potentialY = [];
        let potentialX = [];
        let bufferGain = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.maps.permitted.map[i][j] == 1) {
                    potentialY.push(i);
                    potentialX.push(j);
                    bufferGain.push(this.maps.current.calculateGain(new Square(i, j), this.players.current));
                }
            }
        }
        // If "aiLevel" is at 2 then keeps only possible moves with maximal gain.
        if (this.players.aiLevel == 2) {
            // Finds the maximal possible gain.
            let maxGain = bufferGain.reduce(function (a, b) {
                return Math.max(a, b);
            });
            let maximumY = [];
            let maximumX = [];
            for (let i = 0; i < bufferGain.length; i++) {
                if (bufferGain[i] == maxGain) {
                    maximumY.push(potentialY[i]);
                    maximumX.push(potentialX[i]);
                }
            }
            potentialY = maximumY;
            potentialX = maximumX;
        }
        // Randomly chooses one move among all possible. 
        let randomIndex = Math.floor(Math.random() * potentialY.length);
        // Set a square that AI "clicked".
        let aiChosenSquare = new Square(potentialY[randomIndex], potentialX[randomIndex]);
        let scoreChange = this.maps.current.calculateGain(aiChosenSquare, this.players.current); // Calculates potential gains.
        this.finishMove(aiChosenSquare, scoreChange);
    }

    /**
     * Starts the attempt of setting a new name for a player (input field is shown).
     * @param {string} clickedScore Selector for the clicked score frame.
     */
    startSettingNewName(clickedScore) {
        this.message.oldMessage = $(this.message.html).html();
        let elementId = $(clickedScore).attr("id");
        let player = parseInt(elementId[elementId.length - 1]);
        $(this.message.html).html(`<span>Enter new name for Player ${player}: </span>`);
        $(this.message.html).removeClass("font-white");
        $(this.message.html).addClass("font-black");
        $("#new-name").val("AI (level 2)");
        $("#new-player").show();

        this.players.changeNameOfPlayer = player;
    }

    /**
     * Updates the message when the current player clicks a square, or a name is changed.
     */
    updateMessage() {
        $(this.message.html).html(`Move of ${this.players.name[this.players.current]} (${this.players.getCurrentColor()})`);
        $(this.message.html).removeClass("font-white");
        $(this.message.html).removeClass("font-black");
        $(this.message.html).addClass("font-" + this.players.getCurrentColor());
    }
}


/* The main part of script. */
$(document).ready(function () {
    // Declares the main object.
    let status = {};

    // Reacts to click of "Restart" button (reset to the initial view).
    $("#button-restart").click(function () {
        $("#play").hide();
        $("#welcome").show();
    });

    // Reacts to choosing the "classic" version of Reversi.
    $("#start-classic").click(function () {
        status = new Game(true);
        status.initializeGame("Classic Reversi");
    });

    // Reacts to choosing the "toroid" version of Reversi .
    $("#start-toroid").click(function () {
        status = new Game(false);
        status.initializeGame("Reversi-on-Toroid");
    });

    // Reacts to click of a square (a human move).
    $(".square").click(function () {
        // Reads coordinates of the clicked square.
        let clickedSquare = readCoordinates(this.classList);
        // Displays an alert if the move is not valid.
        if (status.maps.current.map[clickedSquare.y][clickedSquare.x] != 0 || status.players.current == 0) {
            alert("Not a valid move. Click on an EMPTY square!!!");
            return;
        }
        // Calculates potential gains.
        let scoreChange = status.maps.current.calculateGain(clickedSquare, status.players.current);
        // Displays an alert if the move is not valid.
        if (scoreChange == 0) {
            alert("Not a valid move! You MUST capture/flip AT LEAST 1 opponent square!!!");
            return;
        }
        status.finishMove(clickedSquare, scoreChange);
    });

    // Reacts to click of a score frame of Player 1 or 2 to change the player's name.
    $(".score-frame").click(function () {
        status.startSettingNewName(this);
    });

    // Reacts to click of "OK" button for a new name.
    $("#name-ok").click(function () {
        status.finishSettingNewName();
    });
});