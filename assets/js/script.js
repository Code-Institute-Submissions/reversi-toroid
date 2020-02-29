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

// Colors for players: "green" - unoccupied, "black" - player 1, "white" - player 2
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

const AiLevelEnum = {
    MIN: 1, //minimal AI level
    MAX: 2, //maximal AI level
};

if (Object.freeze) {
    Object.freeze(CompassEnum);
    Object.freeze(PlayerColorEnum);
    Object.freeze(AiLevelEnum);
}


function opponent(player) {
    return player % 2 + 1;
}

// Function reads a coordinate ("inputAxis": "x" or "y") of a square from the square's list of classes ("inputClasses").
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


class Players {
    constructor() {
        this.isHuman = [false, true, true]; //[unused, player 1 is human (true/false), player 2 is human (true/false)]
        this.name = ["", "Player1", "Player2"]; //[unused, name of player 1, name of player 2]
        this.current = 0; //current player to move: 0 - empty, 1 - black, 2 - white
        this.aiLevel = 0; //AI level; must be either 1, or 2, or 3, or 4; level 0 is default for no AI player
        this.changeNameOfPlayer = 0; //TEST!!!
    }

    passMove() {
        this.current = opponent(this.current);
    }

    getCurrentColor() {
        return PlayerColorEnum.color[this.current];
    }

    // Function sets "name[player]" to "name" and "isHuman" to "false" for an AI player, or "true" for a human player; returns "false" if there is a problem
    setNewName(name, player) {
        // Analyze the entered new name. If the user tried to select an "AI-name" then comtrol that it is correct
        let newNameStartsWith = name.slice(0, 10);
        // Check whether the new name starts as a correct "AI-name": "AI (level ".
        if (newNameStartsWith == "AI (level ") {
            let newNameEndsWith = name.slice(11, 12);
            // Display an alert if the new name starts as a correct "AI-name" but doesn't end as one.
            if (newNameEndsWith != ')') {
                alert(`The AI level looks strange. It MUST be not lower than ${AiLevelEnum.MIN} and no higher than ${AiLevelEnum.MAX}.`);
                return false;
            }
            // Display an alert if the user tries to switch both players to AI.
            if (!this.isHuman[opponent(player)]) {
                alert("At present there MUST be at least 1 HUMAN player");
                return false;
            } else {
                let newAiLevel = name.charCodeAt(10) - 48;
                // Display an alert if the chosen AI level is not supported yet.
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
        // Set the new name.
        this.name[player] = name;
        // Everything is OK.
        return true;
    }
}

class Square {
    constructor(y, x) {
        this.y = y;
        this.x = x;
    }

    setNewColor(newColor) { // Function sets the color of a "square" to "newColor" ("black" or "white").
        let selector = `.y${this.y}.x${this.x}`;
        $(selector).removeClass("bg-white");
        $(selector).removeClass("bg-black");
        $(selector).removeClass("bg-green");
        $(selector).addClass("bg-" + newColor);
    }

    classicShiftBy(shift) { // Function shifts coordinates of a square "this" on the classic board by a vector "shift". Returns false if square is out of the board.
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

    toroidShiftBy(shift) { // Function shifts coordinates of a square "this" on the toroid board by a vector "shift".
        this.y = (this.y + shift.dy + 8) % 8;
        this.x = (this.x + shift.dx + 8) % 8;
    }
}

class Vector {
    constructor(dy, dx) {
        this.dy = dy;
        this.dx = dx;
    }
}

class Map {
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

    // Function updates "status.maps.current/permitted.map" when the current player ("player") clicks on "square" (square.y, square.x).
    updateMap(square, player) {
        let bufferSquare = new Square(0, 0);

        if (this.type == "current") { // if the map to be updates is current
            this.map[square.y][square.x] = player; //update color of the "square"
            //reverse the opponent's squares
            for (let i = 0; i < 8; i++) {
                if (this.potentialGains[i] > 0) {
                    let dir = CompassEnum.basis[i];
                    Object.assign(bufferSquare, square); // Initialize the buffer square.
                    for (let j = 0; j < this.potentialGains[i]; j++) {
                        bufferSquare.toroidShiftBy(dir);
                        this.map[bufferSquare.y][bufferSquare.x] = player; //update color of the bufferSquare
                    }
                }
            }
        }

        if (this.type == "permitted") { // if the map to be updates is permitted
            this.map[square.y][square.x] = 2; //mark "square" as occupied
            // Check all squares aroung the "square"
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    Object.assign(bufferSquare, square);
                    let shift = new Vector(i, j);
                    if (this.isClassic) {
                        if (!bufferSquare.classicShiftBy(shift)) {
                            continue;
                        }
                    } else {
                        bufferSquare.toroidShiftBy(shift);
                    }
                    // If the neighbour square was marked as unoccupied (this.map == 0) then mark it as permitted for a move
                    if (this.map[bufferSquare.y][bufferSquare.x] == 0) {
                        this.map[bufferSquare.y][bufferSquare.x] = 1;
                    }
                }
            }
        }
    }

    // Function calculates gains in 8 possible directions and the total gain if "player" clicks "square".
    calculateGain(square, player) {
        let output = [];
        for (let i = 0; i < 8; i++) {
            let dir = new Vector(CompassEnum.basis[i].dy, CompassEnum.basis[i].dx);
            let bufferSquare = new Square(square.y, square.x);
            for (let j = 1; j < 8; j++) {
                if (this.isClassic) { // if the map to be updates is classic
                    if (!bufferSquare.classicShiftBy(dir)) {
                        output.push(0);
                        break;
                    }
                    // if the terminal square is empty then gain in this direction is 0
                    if (this.map[bufferSquare.y][bufferSquare.x] == 0) {
                        output.push(0);
                        break;
                    }
                    // if the terminal square is of own color then calcute the gain in this direction
                    if (this.map[bufferSquare.y][bufferSquare.x] == player) {
                        output.push(j - 1);
                        break;
                    }
                } else { // if the map to be updates is toroid
                    bufferSquare.toroidShiftBy(dir);
                    // if the terminal square is empty then gain in this direction is 0
                    if (this.map[bufferSquare.y][bufferSquare.x] == 0) {
                        output.push(0);
                        break;
                    }
                    // if the terminal square is of own color then calcute the gain in this direction
                    if (this.map[bufferSquare.y][bufferSquare.x] == player) {
                        output.push(j - 1);
                        break;
                    }
                }
            }
        }

        this.potentialGains = output;
        this.totalPotentialGain = this.potentialGains.reduce((a, b) => a + b, 0);

        return this.totalPotentialGain;
    }
}

class Maps {
    constructor(isClassic) {
        this.current = new Map(isClassic, "current");
        this.permitted = new Map(isClassic, "permitted");
    }

    // Function updates colors on the board according to "this.current.map".
    updateGameBoard() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                let bufferSquare = new Square(i, j);
                let newColor = PlayerColorEnum.color[this.current.map[i][j]];
                bufferSquare.setNewColor(newColor);
            }
        }
    }

    // Function checks if "player" can move.
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
}

// An object for a board (below the game board) that displays the current score
class ScoreBoard {
    constructor() {
        this.score = [0, 2, 2,];
    }

    player1Wins() {
        return this.score[1] > this.score[2];
    }

    player2Wins() {
        return this.score[1] < this.score[2];
    }

    display(name) { // Function displays the current score.
        for (let i = 1; i < 3; i++) {
            $(`#player${i} > .score`).text(this.score[i]);
            $(`#player${i} > .name`).text(name[i]);
        }
    }

    updateScore(change) { // Function updates the score.
        switch (status.players.current) {
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

// An object for the message section (below the score board) that displays various messages.
class Message {
    constructor() {
        this.html = "#message-content"; //selector for the message section
        this.oldMessage = ""; // A buffer for storage of an old message
        this.newPlayerInput = "new-name"; // an input field for a new name
    }
};

class Game {
    constructor(isClassic) {
        this.players = new Players();
        this.maps = new Maps(isClassic);
        this.scoreBoard = new ScoreBoard();
        this.message = new Message();
    }

    finishSettingNewName() {
        // Try to save the new name.
        let newName = $("#new-name").val();
        if (!this.players.setNewName(newName, this.players.changeNameOfPlayer)) {
            return; // If something went wrong, exit the function without doing anything.
        };
        // Restore the message about the player to move.
        $(this.message.html).html(this.message.oldMessage);
        this.updateMessage();
        // Save the new name and restore current message
        this.scoreBoard.display(status.players.name);
        $("#new-player").hide();
        // If the name of the current player is changed then make the player move by: passing the move to opponent and making the next move. 
        if (this.players.changeNameOfPlayer == this.players.current) {
            this.players.passMove();
            status.makeNextMove();
        }
    }

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

    // Function passes the move to the opposite player, or gives the current player the right to move again, or finishes the game.
    makeNextMove() {
        
        let nextPlayer = opponent(this.players.current);
        console(`Next Player is #${nextPlayer}`);
        let opponentPlayerCanMove = this.maps.canPlayerMove(nextPlayer);
        if (opponentPlayerCanMove) { // if the opponent player can move
            this.players.passMove();
            this.updateMessage();
            potentialAiMove();
        } else {
            console(`Next Player (#${nextPlayer}) cannot move`);
            let nextPlayer = this.players.current;
            let currentPlayerCanMove = this.maps.canPlayerMove(nextPlayer);
            if (currentPlayerCanMove) { // if the opponent player cannot move but the current player can move again
                this.moveAgain();
                potentialAiMove();
            } else {
                this.message.gameResult();
            } // if neither player can move then display the game result message
        }
    }

    moveAgain() {
        $(this.message.html).html(`Move of Player${this.players.current} (${this.players.getCurrentColor()}) again!`);
    }

    startSettingNewName(clickedScore) {
        this.message.oldMessage = $(this.message.html).html();
        let elementId = $(clickedScore).attr("id");
        let player = parseInt(elementId[elementId.length - 1]);
        $(this.message.html).html(`<span>Enter new name for Player ${player}: </span>`);
        $("#new-name").val("AI (level 2)");
        $("#new-player").show();
        this.players.changeNameOfPlayer = player;
    }

    updateMessage() { // Function updates the message when current player (status.players.current) clicks on square, or a name is changed, or the game is over.
        $(this.message.html).html(`Move of ${this.players.name[this.players.current]} (${this.players.getCurrentColor()})`);
        $(this.message.html).removeClass("font-white");
        $(this.message.html).removeClass("font-black");
        $(this.message.html).addClass("font-" + this.players.getCurrentColor());
    }
}

let status = {};

$(document).ready(function () {

    // React to click of "Restart" button (reset to original view).
    $("#button-restart").click(function () {
        $("#play").hide();
        $("#welcome").show();
    });

    // React to choosing the "classic" version of Reversi.
    $("#start-classic").click(function () {
        $("#play > h3").text("Classic Reversi");
        status = new Game(true);
        $("#welcome").hide();
        $("#play").show();
        status.scoreBoard.display(status.players.name);
        status.makeNextMove();
        status.maps.updateGameBoard();

    });

    // React to choosing the "toroid" version of Reversi .
    $("#start-toroid").click(function () {
        $("#play > h3").text("Reversi-on-Toroid");
        status = new Game(false);
        $("#welcome").hide();
        $("#play").show();
        status.scoreBoard.display(status.players.name);
        status.makeNextMove();
        status.maps.updateGameBoard();

    });

    // React to click on a square (a human move).
    $(".square").click(function () {

        // Read coordinates of the clicked square.
        let clickedSquare = readCoordinates(this.classList);

        // Display an alert if the move is not valid.
        if (status.maps.current.map[clickedSquare.y][clickedSquare.x] != 0 || status.players.current == 0) {
            alert("Not a valid move. Click on an EMPTY square!!!");
            return;
        }

        // Calculate gain in all 8 possible directions for "clickedSquare" clicked by current player (status.players.current).
        let scoreChange = status.maps.current.calculateGain(clickedSquare, status.players.current);
        // Display an alert if the move is not valid.
        if (scoreChange == 0) {
            alert("Not a valid move! You MUST capture/flip AT LEAST 1 opponent square!!!");
            return;
        }
        status.scoreBoard.updateScore(scoreChange); // Update score.
        status.scoreBoard.display(status.players.name); // Display the current score.
        status.maps.current.updateMap(clickedSquare, status.players.current); // Update "status.maps.current".
        status.maps.permitted.updateMap(clickedSquare, status.players.current);  // Update "status.maps.permitted".
        status.maps.updateGameBoard(); // Update colors on the board according to the move.
        status.makeNextMove(); // Pass move to the opposite player.
    });

    // React to click of a score frame of player 1 or 2 to change the player's name.
    $(".score-frame").click(function () {
        status.startSettingNewName(this);
    });

    // React to click of "OK" button for a new name.
    $("#name-ok").click(function () {
        status.finishSettingNewName();
    });

});


// Function checks if the next player is AI, and if so makes it move.
function potentialAiMove() {
    if (status.players.isHuman[status.players.current]) {
        return;
    } // The function will not be executed if the current player is human.
    let potentialY = [];
    let potentialX = [];
    let bufferGain = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (status.maps.permitted.map[i][j] == 1) {
                potentialY.push(i);
                potentialX.push(j);
                bufferGain.push(status.maps.current.calculateGain(new Square(i, j), status.players.current));
            }
        }
    }
    // If "aiLevel" is at 2 then consider only moves with maximal gain.
    if (status.players.aiLevel == 2) {
        let maxGain = bufferGain.reduce(function (a, b) {
            return Math.max(a, b);
        }); // Find the maximal possible gain.
        let maximumY = [];
        let maximumX = [];
        for (i = 0; i < bufferGain.length; i++) {
            if (bufferGain[i] == maxGain) {
                maximumY.push(potentialY[i]);
                maximumX.push(potentialX[i]);
            }
        }
        potentialY = maximumY;
        potentialX = maximumX;
    }
    // Randomly choose one move among all possible. 
    let randomIndex = Math.floor(Math.random() * potentialY.length);
    // Set a square that AI "clicked".
    let clickedSquare = new Square(potentialY[randomIndex], potentialX[randomIndex]);

    let scoreChange = status.maps.current.calculateGain(clickedSquare, status.players.current); // Calculate potential gains in all 8 possible directions for "clickedSquare" clicked by the current player ("status.players.current").
    status.scoreBoard.updateScore(scoreChange); // Update score.
    status.scoreBoard.display(status.players.name); // Display the current score.
    status.maps.current.updateMap(clickedSquare, status.players.current);  // Update "status.maps.current".
    status.maps.permitted.updateMap(clickedSquare, status.players.current); // Update "status.maps.permitted".
    status.maps.updateGameBoard(); // Update colors on the board according to the move.
    status.makeNextMove(); // Pass move to the opposite player.
}
