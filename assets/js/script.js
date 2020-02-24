const basis = [
    { dy: -1, dx: 0 },
    { dy: -1, dx: 1 },
    { dy: 0, dx: 1 },
    { dy: 1, dx: 1 },
    { dy: 1, dx: 0 },
    { dy: 1, dx: -1 },
    { dy: 0, dx: -1 },
    { dy: -1, dx: -1 },
]; //basis for testeing possible gains in 8 different directions (N, NE, E, SE, S, SW, W, NW)

const playerColor = ["green", "black", "white"]; //colors for players: "green" - unoccupied, "black" - player 1, "white" - player 2

const aiLevel = {
    MIN: 1, //minimal AI level
    MAX: 2, //maximal AI level
}


if (Object.freeze) {
    Object.freeze(basis);
    Object.freeze(playerColor);
    Object.freeze(aiLevel);
}

// The main data object with constants and main variables.
let status = {
    boardIsClassic: false, //flag for type of game rules: true - classic game on a square board, false - game on a toroid board
    playerIsHuman: [false, true, true], //[unused, player 1 is human (true/false), player 2 is human (true/false)]
    name: ["", "Player1", "Player2"], //[unused, name of player 1, name of player 2]
    score: [0, 2, 2], //[unused, score of player 1, score of player 2]

    player: 0, //current player to move: 0 - empty, 1 - black, 2 - white
    aiPlayerLevel: 0, //AI level; must be either 1, or 2, or 3, or 4; level 0 is default for no AI player
    maps: {
        current: {},
        permitted: {},
    },
/*    mapCurrent: {}, //map for the board: 0 - empty, 1 - black, 2 - white
    map.permitted: {}, //map for permitted moves: 0 - empty, 1 - permitted, 2 - occupied
*/
    totalCalculatedGain: 0, // buffer variable for total potentintial gain obtained if a particular square is clicked
    individualCalculatedGains: [], // buffer array for individual potentintial gains in 8 directions obtained if a particular square is clicked
}

class Map {
    constructor(isClassic, typeOfMap) {
        this.isClassic = isClassic;
        this.type = typeOfMap;
        this.map = [];
        // Create an array and initialize all its elements to 0.
        for (let i = 0; i < 8; i++) {
            let mapRow = [];
            for (let j = 0; j < 8; j++) { mapRow[j] = 0; }
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
    }

    // Function updates "status.maps.current/permitted.map" when the current player ("player") clicks on a "centerSquare" square (centerSquare.y, centerSquare.x).
    update(centerSquare, player) {
        let bufferSquare = {y: 0, x: 0}; // a square on the game board to be modified

        if (this.type == "current") { // if the map to be updates is current
            this.map[centerSquare.y][centerSquare.x] = player; //update color of the centerSquare
            let gain = status.individualCalculatedGains; //a temporary short variable for an array with 8 gains in different directions
            //reverse the opponent's squares
            for (let i = 0; i < 8; i++) {
                if (gain[i] > 0) {
                    let dir = basis[i];
                    bufferSquare = { y: centerSquare.y, x: centerSquare.x };
                    for (let j = 0; j < gain[i]; j++) {
                        bufferSquare.y = toroidCoordinate(bufferSquare.y, dir.dy);
                        bufferSquare.x = toroidCoordinate(bufferSquare.x, dir.dx);
                        this.map[bufferSquare.y][bufferSquare.x] = player; //update color of the centerSquare
                    }
                }
            }
        }

        if (this.type == "permitted") { // if the map to be updates is current
            this.map[centerSquare.y][centerSquare.x] = 2; //mark the "centerSquare" as occupied
            // Check all squares aroung the "centerSquare" 
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    // Calculate "classical" or "toroid" coordinates of the square to be checked
                    if (this.isClassic) {
                        bufferSquare.x = centerSquare.x + i;
                        bufferSquare.y = centerSquare.y + j;
                    } else {
                        bufferSquare.x = toroidCoordinate(centerSquare.x, i);
                        bufferSquare.y = toroidCoordinate(centerSquare.y, j);
                    }
                    // If out of board then check the next square
                    if (this.isClassic && (bufferSquare.x < 0 || bufferSquare.x > 7 || bufferSquare.y < 0 || bufferSquare.y > 7)) { continue; }
                    // If the neighbour square was marked as unoccupied (this.map == 0) then mark it as permitted for a move
                    if (this.map[bufferSquare.y][bufferSquare.x] == 0) { this.map[bufferSquare.y][bufferSquare.x] = 1; }
                }
            }
        }
    };
}

// An object for a board (below the game board) that displays the current score
let scoreBoard = {
    update: function (score, name) { // Function displays the current score.
        for (let i = 1; i < 3; i++) {
            $(`#player${i} > .score`).text(score[i]);
            $(`#player${i} > .name`).text(name[i]);
        }
    },
}

// An object for the message section (below the score board) that displays various messages.
let message = {
    html: "#message-content", //selector for the message section

    update: function () { // Function updates the message when current player (status.player) clicks on square, or a name is changed, or the game is over.
        $(this.html).html(`Move of ${status.name[status.player]} (${playerColor[status.player]})`);
        $(this.html).removeClass("font-white");
        $(this.html).removeClass("font-black");
        $(this.html).addClass("font-" + playerColor[status.player]);
    },

    moveAgain: function (player) {
        $(this.html).html(`Move of Player${player} (${playerColor[player]}) again!`);
    },

    gameResult: function () {
        let winMessage = "DRAW";
        if (status.score[1] > status.score[2]) { winMessage = `${status.name[1]} (${playerColor[1]}) WON!!!`; }
        if (status.score[1] < status.score[2]) { winMessage = `${status.name[2]} (${playerColor[2]}) WON!!!`; }
        $(message.html).html(winMessage);
    },
}


$(document).ready(function () {

    // React to clicking the "Restart" button (reset to original view).
    $("#button-restart").click(function () {
        $("#play").hide();
        $("#welcome").show();
    });

    // React to choosing the "classic" version of Reversi.
    $("#start-classic").click(function () {
        $("#play > h3").text("Classic Reversi");
        status.boardIsClassic = true;
        initializeBoardAndScore();
    });

    // React to choosing the "toroid" version of Reversi .
    $("#start-toroid").click(function () {
        $("#play > h3").text("Reversi-on-Toroid");
        status.boardIsClassic = false;
        initializeBoardAndScore();
    });

    // React to clicking the score frame of player 1 or 2 to change the player's name.
    $(".score-frame").click(function () { chooseNewName(this); });

    // React to click on a square (a human move).
    $(".square").click(function () {

        // Read coordinates of the clicked square.
        let currentClasses = this.classList;
        let clickedSquare = {
            y: readCoordinate(currentClasses, "y"),
            x: readCoordinate(currentClasses, "x"),
        }

        // Check if the clicked square is already of the "clicking" color...
        if (status.maps.current.map[clickedSquare.y][clickedSquare.x] != 0 || status.player == 0) {
            alert("Not a valid move. Click on an EMPTY square!!!"); // ... if so, show an alert and do not react.
            return;
        }

        // Calculate gain in all 8 possible directions for clickedSquare clicked by current player (status.player) and check that the move is valid.
        if (calculateGain(clickedSquare, status.player) == 0) {
            alert("Not a valid move! You MUST capture/flip AT LEAST 1 opponent square!!!"); // ... if not, show an alert and do not react.
            return;
        }

        status.maps.current.update(clickedSquare, status.player); // Update "status.maps.current".
        status.maps.permitted.update(clickedSquare, status.player);  // Update "status.maps.permitted".
        updateBoardDisplay(); // Update colors on the board according to the move.

        updateScore(); // Update score.
        scoreBoard.update(status.score, status.name); // Display the current score.

        updatePlayer(); // Pass move to the opposite player.
    });

});


/* Function to calculate potential gain if "playerToTest" clicks a square "center".
 * It saves gains in individual 8 directions in "status.individualCalculatedGains", and the total gain in "status.totalCalculatedGain".
 * The function returns the total gain. */
function calculateGain(center, playerToTest) {
    let potentialGains = status.boardIsClassic ? calculateGainClassic(center, playerToTest) : calculateGainToroid(center, playerToTest);
    status.individualCalculatedGains = potentialGains;
    status.totalCalculatedGain = potentialGains.reduce((a, b) => a + b, 0);
    return status.totalCalculatedGain;
}

// Function calculates gain if "playerToTest" clicks the "center" square for Classic rules.
function calculateGainClassic(center, playerToTest) {
    let output = [];
    for (let i = 0; i < 8; i++) {
        let dir = basis[i];
        let toBeTested = { y: center.y, x: center.x }; // Initialize the square to be tested for 1 particular direction.
        for (let j = 1; j < 8; j++) {
            toBeTested.y += dir.dy;
            // if the terminal square is out of board vertically then gain in this direction is 0
            if (toBeTested.y < 0 || toBeTested.y > 7) {
                output.push(0);
                break;
            }
            toBeTested.x += dir.dx;
            // if the terminal square is out of board horizontally then gain in this direction is 0
            if (toBeTested.x < 0 || toBeTested.x > 7) {
                output.push(0);
                break;
            }
            // if the terminal square is empty then gain in this direction is 0
            if (status.maps.current.map[toBeTested.y][toBeTested.x] == 0) {
                output.push(0);
                break;
            }
            // if the terminal square is of own color then calcute the gain in this direction
            if (status.maps.current.map[toBeTested.y][toBeTested.x] == playerToTest) {
                output.push(j - 1);
                break;
            }
        }
    }
    return output;
}

// Function calculates gain if "playerToTest" clicks the "center" square for Reversi-on-Toroid rules.
function calculateGainToroid(center, playerToTest) {
    let output = [];
    for (let i = 0; i < 8; i++) {
        let dir = basis[i];
        let toBeTested = { y: center.y, x: center.x };
        for (let j = 1; j < 8; j++) {
            toBeTested.y = toroidCoordinate(toBeTested.y, dir.dy);
            toBeTested.x = toroidCoordinate(toBeTested.x, dir.dx);
            // if the terminal square is empty then gain in this direction is 0
            if (status.maps.current.map[toBeTested.y][toBeTested.x] == 0) {
                output.push(0);
                break;
            }
            // if the terminal square is of own color then calcute the gain in this direction
            if (status.maps.current.map[toBeTested.y][toBeTested.x] == playerToTest) {
                output.push(j - 1);
                break;
            }
        }
    }
    return output;
}

// Function checks if "player" can move.
function checkIfPlayerCanMove(player) {
    let reply = false;
    for (let i = 0; i < 8; i++) {
        if (reply) { break; }
        for (let j = 0; j < 8; j++) {
            if (status.maps.permitted.map[i][j] != 1) { continue; }
            let totalPotentialGain = calculateGain({ y: i, x: j }, player);
            if (totalPotentialGain > 0) {
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
        if (setNewName(newName, playerNumber) == -100) { return; }; // If something went wrong, exit the function without doing anything.
        scoreBoard.update(status.score, status.name);
        $(message.html).html(messageBuffer);
        message.update();
        // If the name of the current player is changed then pretend that the current is opponent and force update the current player (to make it move). 
        if (playerNumber == status.player) {
            status.player = status.player % 2 + 1;
            updatePlayer();
        }
    });
}

// Function initializes the board, score, and player message.
function initializeBoardAndScore() {
    status.maps.current = new Map(status.boardIsClassic, "current");
    status.maps.permitted = new Map(status.boardIsClassic, "permitted");
    status.score[1] = 2;
    status.score[2] = 2;
    status.player = 2; // Pretend that the current player is 2 (the next one must be 1).
    updatePlayer();
    updateBoardDisplay();
    $("#welcome").hide();
    $("#play").show();
    scoreBoard.update(status.score, status.name);
}


// Function checks if the next player is AI, and if so makes it move.
function potentialAiMove() {
    if (status.playerIsHuman[status.player]) { return; } // The function will not be executed if the current player is human.
    let potentialY = [];
    let potentialX = [];
    let potentialGain = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (status.maps.permitted.map[i][j] == 1) {
                let buffer = calculateGain({ y: i, x: j }, status.player);
                potentialY.push(i);
                potentialX.push(j);
                potentialGain.push(buffer);
            }
        }
    }
    // If "aiPlayerLevel" is at 2 then consider only moves with maximal gain.
    if (status.aiPlayerLevel == 2) {
        let maxGain = potentialGain.reduce(function (a, b) { return Math.max(a, b); }); // Find the maximal possible gain.
        let maximumY = [];
        let maximumX = [];
        for (i = 0; i < potentialGain.length; i++) {
            if (potentialGain[i] == maxGain) {
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
    let clickedSquare = {
        y: potentialY[randomIndex],
        x: potentialX[randomIndex],
    }

    calculateGain(clickedSquare, status.player); // Calculate gain in all 8 possible directions for "clickedSquare" clicked by the current player ("status.player").
    status.maps.current.update(clickedSquare, status.player);  // Update "status.maps.current".
    status.maps.permitted.update(clickedSquare, status.player); // Update "status.maps.permitted".
    updateBoardDisplay(); // Update colors on the board according to the move.

    updateScore(); // Update score.
    scoreBoard.update(status.score, status.name); // Display the current score.

    updatePlayer(); // Pass move to the opposite player.
}

// Function reads a coordinate ("inputAxis": "x" or "y") of a square from the square's list of classes ("inputClasses").
function readCoordinate(inputClasses, inputAxis) {
    for (let i of inputClasses) {
        if (i.length == 2 && i[0] == inputAxis) {
            let coordinate = parseInt(i[1]);
            if (Number.isInteger(coordinate) && coordinate > -1 && coordinate < 8) {
                return coordinate;
            }
        }
    }
}

// Function sets the color of a square "squareToBeChanged" to "newColor" ("black" or "white").
function setNewColor(squareToBeChanged, newColor) {
    let selector = `.y${squareToBeChanged.y}.x${squareToBeChanged.x}`;
    $(selector).removeClass("bg-white");
    $(selector).removeClass("bg-black");
    $(selector).removeClass("bg-green");
    $(selector).addClass("bg-" + newColor);
}

// Function sets a new name ("newName") and "playerIsHuman" flag (0 for an AI player, or 1 for a human player); returns -100 if there is a problem
function setNewName(newName, playerNumber) {
    // Analyze the entered new name. If the user tried to select an "AI-name" then comtrol that it is correct
    let opponentPlayerNumber = playerNumber % 2 + 1; //calculate the opponent player number
    let newNameStartsWith = newName.slice(0, 10);
    let newNameEndsWith = newName.slice(11, 12);
    if (newNameStartsWith == "AI (level ") { // if the new name starts as a correct "AI-name"
        if (newNameEndsWith != ')') { // if the new name starts as a correct "AI-name" but doesn't end as one
            alert(`The AI level looks strange. It MUST be not lower than ${aiLevel.MIN} and no higher than ${aiLevel.MAX}.`);
            return -100;
        }
        if (!status.playerIsHuman[opponentPlayerNumber]) { // if the user tries to switch both players to AI
            alert("At present there MUST be at least 1 HUMAN player");
            return -100;
        } else {
            let newAiPlayerLevel = newName.charCodeAt(10) - 48;
            if (newAiPlayerLevel < aiLevel.MIN || newAiPlayerLevel > aiLevel.MAX) { // if the chosen AI level is not supported yet
                alert(`At present minimal AI level is ${aiLevel.MIN} and maximal is ${aiLevel.MAX}. While you try to set it to ${newAiPlayerLevel}.`);
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

// Function calculates a coordinate on toroid if the initial coordinate is "c0" and the coordinate shift is "dC".
function toroidCoordinate(c0, dC) {
    return (c0 + dC + 8) % 8;
}



// Function passes the move to the opposite player, or gives the current player the right to move again, or finishes the game.
function updatePlayer() {
    let opponentPlayerCanMove = checkIfPlayerCanMove(status.player % 2 + 1);
    if (opponentPlayerCanMove) { // if the opponent player can move
        status.player = status.player % 2 + 1;
        message.update();
        potentialAiMove();
    } else {
        let currentPlayerCanMove = checkIfPlayerCanMove((status.player + 1) % 2 + 1);
        if (currentPlayerCanMove) { // if the opponent player cannot move but the current player can move again
            message.moveAgain(status.player);
            potentialAiMove();
        } else { message.gameResult(); } // if neither player can move then display the game result message
    }
}

// Function updates the score.
function updateScore() {
    let changeScoreBy = status.totalCalculatedGain;
    if (status.player == 1) {
        status.score[1] += changeScoreBy + 1;
        status.score[2] -= changeScoreBy;
    }
    if (status.player == 2) {
        status.score[2] += changeScoreBy + 1;
        status.score[1] -= changeScoreBy;
    }
};

// Function updates colors on the board according to "status.maps.current".
function updateBoardDisplay() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            setNewColor({ y: i, x: j }, playerColor[status.maps.current.map[i][j]]);
        }
    }
}