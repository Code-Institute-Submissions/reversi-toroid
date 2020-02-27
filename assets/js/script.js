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


// The main data object with constants and main variables.
let status = {
    playerIsHuman: [false, true, true,], //[unused, player 1 is human (true/false), player 2 is human (true/false)]
    name: ["", "Player1", "Player2",], //[unused, name of player 1, name of player 2]
    player: 0, //current player to move: 0 - empty, 1 - black, 2 - white
    aiPlayerLevel: 0, //AI level; must be either 1, or 2, or 3, or 4; level 0 is default for no AI player
    maps: { // An object for maps.
        current: {},
        permitted: {},
    },
    scoreBoard: {}, // An object for the score board.
};

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
        if (this.y < 0 || this.y > 7 || this.x < 0 || this.y > 7) {
            return false;
        } else {
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
            let bufferSquare = new Square (square.y, square.x);
            for (let j = 1; j < 8; j++) {
                if (this.isClassic) { // if the map to be updates is classic
                    if(!bufferSquare.classicShiftBy(dir)) {
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

    updateGameBoard() { // Function updates colors on the board according to "status.maps.current".
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                let bufferSquare = new Square(i, j);
                let newColor = PlayerColorEnum.color[this.map[i][j]];
                bufferSquare.setNewColor(newColor);
            }
        }
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

    display() { // Function displays the current score.
        for (let i = 1; i < 3; i++) {
            $(`#player${i} > .score`).text(this.score[i]);
            $(`#player${i} > .name`).text(status.name[i]);
        }
    }

    updateScore() { // Function updates the score.
        let changeScoreBy = status.maps.current.totalPotentialGain;
        switch (status.player) {
            case 1:
                this.score[1] += changeScoreBy + 1;
                this.score[2] -= changeScoreBy;
                break;
            case 2:
                this.score[2] += changeScoreBy + 1;
                this.score[1] -= changeScoreBy;
                break;
        }
    }

};

// An object for the message section (below the score board) that displays various messages.
let message = {
    html: "#message-content", //selector for the message section

    update() { // Function updates the message when current player (status.player) clicks on square, or a name is changed, or the game is over.
        $(this.html).html(`Move of ${status.name[status.player]} (${PlayerColorEnum.color[status.player]})`);
        $(this.html).removeClass("font-white");
        $(this.html).removeClass("font-black");
        $(this.html).addClass("font-" + PlayerColorEnum.color[status.player]);
    },

    moveAgain() {
        $(this.html).html(`Move of Player${status.player} (${PlayerColorEnum.color[status.player]}) again!`);
    },

    gameResult() {
        let winMessage = "DRAW";
        if (status.scoreBoard.player1Wins()) {
            winMessage = `${status.name[1]} (${PlayerColorEnum.color[1]}) WON!!!`;
        }
        if (status.scoreBoard.player2Wins()) {
            winMessage = `${status.name[2]} (${PlayerColorEnum.color[2]}) WON!!!`;
        }
        $(this.html).html(winMessage);
    }
};


$(document).ready(function () {

    // React to clicking the "Restart" button (reset to original view).
    $("#button-restart").click(function () {
        $("#play").hide();
        $("#welcome").show();
    });

    // React to choosing the "classic" version of Reversi.
    $("#start-classic").click(function () {
        $("#play > h3").text("Classic Reversi");
        status.maps.current = new Map(true, "current");
        status.maps.permitted = new Map(true, "permitted");
        status.scoreBoard = new ScoreBoard();
        initializeBoardAndScore();
    });

    // React to choosing the "toroid" version of Reversi .
    $("#start-toroid").click(function () {
        $("#play > h3").text("Reversi-on-Toroid");
        status.maps.current = new Map(false, "current");
        status.maps.permitted = new Map(false, "permitted");
        status.scoreBoard = new ScoreBoard();
        initializeBoardAndScore();
    });

    // React to clicking the score frame of player 1 or 2 to change the player's name.
    $(".score-frame").click(function () {
        chooseNewName(this);
    });

    // React to click on a square (a human move).
    $(".square").click(function () {

        // Read coordinates of the clicked square.
        let clickedSquare = readCoordinates(this.classList);

        // Check if the clicked square is already of the "clicking" color...
        if (status.maps.current.map[clickedSquare.y][clickedSquare.x] != 0 || status.player == 0) {
            alert("Not a valid move. Click on an EMPTY square!!!"); // ... if so, show an alert and do not react.
            return;
        }

        // Calculate gain in all 8 possible directions for clickedSquare clicked by current player (status.player) and check that the move is valid.
        if (status.maps.current.calculateGain(clickedSquare, status.player) == 0) {
            alert("Not a valid move! You MUST capture/flip AT LEAST 1 opponent square!!!"); // ... if not, show an alert and do not react.
            return;
        }

        status.maps.current.updateMap(clickedSquare, status.player); // Update "status.maps.current".
        status.maps.permitted.updateMap(clickedSquare, status.player);  // Update "status.maps.permitted".
        status.maps.current.updateGameBoard(); // Update colors on the board according to the move.

        status.scoreBoard.updateScore(); // Update score.
        status.scoreBoard.display(); // Display the current score.

        makeNextMove(); // Pass move to the opposite player.
    });

});


// Function checks if "player" can move.
function checkIfPlayerCanMove(player) {
    let reply = false;
    for (let i = 0; i < 8; i++) {
        if (reply) {
            break;
        }
        for (let j = 0; j < 8; j++) {
            if (status.maps.permitted.map[i][j] != 1) {
                continue;
            }
            if (status.maps.current.calculateGain(new Square(i, j), player) > 0) {
                reply = true;
                break;
            }
        }
    }
    return reply;
}

// Functions allows to change a player's name.
function chooseNewName(clickedScore) {
    const inputFieldId = "new-name"; //id for the input element to type a new name
    const okButtonId = "name-ok"; //id for the OK button

    let messageBuffer = $(message.html).html(); // Save current message to restore it after setting a new name.

    // Find out which score was clicked and thus which name should be changed.
    let elementId = $(clickedScore).attr("id");
    let lastIdSymbol = elementId[elementId.length - 1];
    let playerNumber = parseInt(lastIdSymbol);
    $(message.html).html(`<span>Enter new name for Player ${playerNumber}: </span><input id="${inputFieldId}" type="text" value="AI (level 2)" size="12"><button id="${okButtonId}">OK</button>`);

    // Save the new name and restore current message
    $(`#${okButtonId}`).click(function () {
        let newName = $(`#${inputFieldId}`).val();
        if (setNewName(newName, playerNumber) == -100) { // If something went wrong, exit the function without doing anything.
            return;
        };
        status.scoreBoard.display();
        $(message.html).html(messageBuffer);
        message.update();
        // If the name of the current player is changed then pretend that the current is opponent and force update the current player (to make it move). 
        if (playerNumber == status.player) {
            status.player = status.player % 2 + 1;
            makeNextMove();
        }
    });
}


// Function initializes the board, score, and player message.
function initializeBoardAndScore() {
    status.player = 2; // Pretend that the current player is 2 (the next one must be 1).
    makeNextMove();
    status.maps.current.updateGameBoard();
    $("#welcome").hide();
    $("#play").show();
    status.scoreBoard.display();
}


// Function checks if the next player is AI, and if so makes it move.
function potentialAiMove() {
    if (status.playerIsHuman[status.player]) {
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
                bufferGain.push(status.maps.current.calculateGain(new Square(i, j), status.player));
            }
        }
    }
    // If "aiPlayerLevel" is at 2 then consider only moves with maximal gain.
    if (status.aiPlayerLevel == 2) {
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

    status.maps.current.calculateGain(clickedSquare, status.player); // Calculate potential gains in all 8 possible directions for "clickedSquare" clicked by the current player ("status.player").
    status.maps.current.updateMap(clickedSquare, status.player);  // Update "status.maps.current".
    status.maps.permitted.updateMap(clickedSquare, status.player); // Update "status.maps.permitted".
    status.maps.current.updateGameBoard(); // Update colors on the board according to the move.

    status.scoreBoard.updateScore(); // Update score.
    status.scoreBoard.display(); // Display the current score.

    makeNextMove(); // Pass move to the opposite player.
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


// Function sets a new name ("newName") and "playerIsHuman" flag (0 for an AI player, or 1 for a human player); returns -100 if there is a problem
function setNewName(newName, playerNumber) {
    // Analyze the entered new name. If the user tried to select an "AI-name" then comtrol that it is correct
    let opponentPlayerNumber = playerNumber % 2 + 1; //calculate the opponent player number
    let newNameStartsWith = newName.slice(0, 10);
    let newNameEndsWith = newName.slice(11, 12);
    if (newNameStartsWith == "AI (level ") { // if the new name starts as a correct "AI-name"
        if (newNameEndsWith != ')') { // if the new name starts as a correct "AI-name" but doesn't end as one
            alert(`The AI level looks strange. It MUST be not lower than ${AiLevelEnum.MIN} and no higher than ${AiLevelEnum.MAX}.`);
            return -100;
        }
        if (!status.playerIsHuman[opponentPlayerNumber]) { // if the user tries to switch both players to AI
            alert("At present there MUST be at least 1 HUMAN player");
            return -100;
        } else {
            let newAiPlayerLevel = newName.charCodeAt(10) - 48;
            if (newAiPlayerLevel < AiLevelEnum.MIN || newAiPlayerLevel > AiLevelEnum.MAX) { // if the chosen AI level is not supported yet
                alert(`At present minimal AI level is ${AiLevelEnum.MIN} and maximal is ${AiLevelEnum.MAX}. While you try to set it to ${newAiPlayerLevel}.`);
                return -100;
            } else { // the new name is a correct "AI-name"
                status.playerIsHuman[playerNumber] = false;
                status.aiPlayerLevel = newAiPlayerLevel;
            }
        }
    } else { // the new name is a "human" name
        status.playerIsHuman[playerNumber] = true;
    }

    status.name[playerNumber] = newName; //set the new name
}

// Function passes the move to the opposite player, or gives the current player the right to move again, or finishes the game.
function makeNextMove() {
    let opponentPlayerCanMove = checkIfPlayerCanMove(status.player % 2 + 1);
    if (opponentPlayerCanMove) { // if the opponent player can move
        status.player = status.player % 2 + 1;
        message.update();
        potentialAiMove();
    } else {
        let currentPlayerCanMove = checkIfPlayerCanMove((status.player + 1) % 2 + 1);
        if (currentPlayerCanMove) { // if the opponent player cannot move but the current player can move again
            message.moveAgain();
            potentialAiMove();
        } else {
            message.gameResult();
        } // if neither player can move then display the game result message
    }
}
