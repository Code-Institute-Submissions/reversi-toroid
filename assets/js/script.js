$(document).ready(function () {

    //The main data object with constants and main variables
    let status = {
        basis: [
            { dy: -1, dx: 0 },
            { dy: -1, dx: 1 },
            { dy: 0, dx: 1 },
            { dy: 1, dx: 1 },
            { dy: 1, dx: 0 },
            { dy: 1, dx: -1 },
            { dy: 0, dx: -1 },
            { dy: -1, dx: -1 },
        ], //basis for different directions
        colors: ["green", "black", "white"], //colors for players
        boardIsClassic: false, //flag for type of game rules: true - classic game on a square board, false - game on a toroid board
        player: 0, //current player to move: 0 - nobody, 1 - black, 2 - white
        score: [0, 2, 2], //[unused, score of player 1, score of player 2]
        name: ["", "Player1", "Player2"], //[unused, name of player 1, name of player 2]
        playerIsHuman: [false, true, true], //[unused, player 1 is human (true/false), player 2 is human (true/false)]
        aiLevel: 0, //AI level; must be either 1, or 2, or 3, or 4; level 0 is default for no AI player
        nPlayersCanMove: 0, //number of players who can move: 0 - nobody (end of game), 1 - one of the players cannot move, 2 - both can move
        mapCurrent: [], //map for the board: 0 - nobody, 1 - white, 2 - black
        mapPermitted: [], //map for permitted moves: 0 - empty, 1 - permitted, 2 - occupied
        mapGains: [], /* map: mapGains[y][x] is possible gain {sum, gains[]} if a square with coordinates (y, x) is clicked; gains[] are gains is 8 directions, sum is the sum of all gains */
    }

    //react to clicking the "Home" button (reset to original view)
    $("#nav-home").click(function () {
        for (let i = 0; i < 8; i++) { for (let j = 0; j < 8; j++) { status.mapCurrent[i][j] = 0; } } //set all squares to unoccupied (=0)
        updateWebPage(status); //display the reset board
        $("header > p").text("Reversi Game");
        $("#score-display").hide();
        $("#start-buttons").show();
        $("#message-section").hide();
    });

    //react to clicking the "Home" button (reset to original view)
    $("#nav-help").click(function () {
        alert(
            "This game is a slightly modified game of Reversi ( https://en.wikipedia.org/wiki/Reversi ).\n" +
            'You can play either “Classic Reversi” or “Reversi-on-Toroid”.\n\n' +
            '“CLASSIC” RULES:\n' +
            "1) The BLACK player moves first. BLACK must click a square on the board, so that there exists at least one straight (horizontal, vertical, or diagonal) " +
            "occupied line between the new BLACK square and another BLACK square, with one or more contiguous WHITE squares between them.\n" +
            "2) After clicking the square, BLACK flips/captures (makes BLACK) all WHITE squares lying on a straight line between the new square " +
            "and any old BLACK squares. Thus, a valid move is one where at least one square is reversed.\n" +
            "3) Now WHITE plays. WHITE clicks an empty (GREEN) square making it WHITE, causing BLACK squares to flip.\n" +
            "4) Players take alternate turns. If one player cannot make a valid move, play passes back to the other player.\n" +
            "5) The game ends when neither player can legally click any of the remaining squares.\n" +
            '“REVERSI-ON-TOROID” RULES:\n' +
            "All rules are the same as in “Classic” but the board is treated as a toroid:\n" +
            "1) The rightmost vertical is considered the left neighbor of the rightmost vertical.\n" +
            "2) The top horizontal is considered the bottom neighbor of the bottom horizontal.\n"
        );
    });

    //react to choosing the "classic" version of Reversi 
    $("#start-classic").click(function () {
        $("header > p").text("Classic Reversi");
        status.boardIsClassic = true;
        initializeBoardAndScore(status);
    });

    //react to choosing the "toroid" version of Reversi 
    $("#start-toroid").click(function () {
        $("header > p").text("Reversi-on-Toroid");
        status.boardIsClassic = false;
        initializeBoardAndScore(status);
    });

    //react to clicking the score frame of player 1 or 2 to change the player's name
    $(".score-frame").click(function () {
        let messageBuffer = $("#message-content").html();
        let elementID = $(this).attr("id");
        let lastIDSymbol = elementID[elementID.length - 1];
        let playerNumber = parseInt(lastIDSymbol);
        let opponentPlayerNumber = playerNumber % 2 + 1;
        $("#message-content").html(`<span>Enter new name for Player ${playerNumber}: </span><input id="new-name" type="text" value="AI (level 1)" size="12"><button id="name-ok">OK</button>`);
        $("#name-ok").click(function () {
            let newName = $("#new-name").val();
            let newNameStartsWith = newName.slice(0, 10);
            if (newNameStartsWith == "AI (level ") {
                if (!status.playerIsHuman[opponentPlayerNumber]) {
                    alert("At present there MUST be at least 1 HUMAN player");
                    return;
                } else {
                    let newAiLevel = newName.charCodeAt(10) - 48;
                    if (newAiLevel < 1 || newAiLevel > 4) {
                        alert("At present minimal AI level is 1 and maximal is 4.");
                        return;
                    } else {
                        status.playerIsHuman[playerNumber] = false;
                        status.aiLevel = newAiLevel;
                    }
                }
            } else {
                status.playerIsHuman[playerNumber] = true;
                status.aiLevel = 0;
            }
            status.name[playerNumber] = newName;
            displayScore(status);
            $("#message-content").html(messageBuffer);
            updateMessage(status);
        });
    });

    //react to click on a square
    $(".square").click(function () {

        //read coordinates of the clicked square
        let currentClasses = this.classList;
        let clickedSquare = {
            y: readCoordinate(currentClasses, "y"),
            x: readCoordinate(currentClasses, "x"),
        }

        //check if the clicked square is already of the "clicking" color
        if (status.mapCurrent[clickedSquare.y][clickedSquare.x] != 0 || status.player == 0) {
            alert("Not a valid move. Click on an EMPTY square!!!");
            return;
        }
        //calculate gain in all 8 possible directions for clickedSquare clicked by current player (status.player)
        if (calculateGain(status, clickedSquare, status.player) == 0) {
            alert("Not a valid move! You MUST capture/flip AT LEAST 1 opponent square!!!");
            return;
        }

        //update the mapCurrent
        updateMapCurrent(status, clickedSquare);
        //update the mapPermitted
        updateMapPermitted(status, clickedSquare);
        //change color of the clicked square
        updateWebPage(status);

        //update score
        updateScore(status, clickedSquare);
        //change color of the clicked square
        displayScore(status);

        //pass to the opposite player
        updatePlayer(status);

    });

});

// Function to calculate gain from center of centerColor with (centerX, centerY) in direction (dir.dy, dir.dx) using an array with 8 direction vectors (basis)
function calculateGain(status, center, playerToTest) {
    let possibleGain = status.boardIsClassic ? calculateGainClassic(status, center, playerToTest) : calculateGainToroid(status, center, playerToTest);
    status.mapGains[center.y][center.x].gains = possibleGain;
    status.mapGains[center.y][center.x].totalgain = possibleGain.reduce((a, b) => a + b, 0);
    return status.mapGains[center.y][center.x].totalgain;
}

// Function to calculate gain from center of centerColor with (centerX, centerY) in direction (dir.dy, dir.dx) using an array with 8 direction vectors (basis)
// for Reversi-on-Toroid rules
function calculateGainClassic(status, center, playerToTest) {
    let output = [];
    for (let i = 0; i < 8; i++) {
        let dir = status.basis[i];
        let toBeTested = { y: center.y, x: center.x };
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
            if (status.mapCurrent[toBeTested.y][toBeTested.x] == 0) {
                output.push(0);
                break;
            }
            // if the terminal square is of own color then calcute the gain in this direction
            if (status.mapCurrent[toBeTested.y][toBeTested.x] == playerToTest) {
                output.push(j - 1);
                break;
            }
        }
    }
    return output;
}

// Function to calculate gain from center of centerColor with (centerX, centerY) in direction (dir.dy, dir.dx) using an array with 8 direction vectors (basis)
// for Reversi-on-Toroid rules
function calculateGainToroid(status, center, playerToTest) {
    let output = [];
    for (let i = 0; i < 8; i++) {
        let dir = status.basis[i];
        let toBeTested = { y: center.y, x: center.x };
        for (let j = 1; j < 8; j++) {
            toBeTested.y = toroidCoordinate(toBeTested.y, dir.dy);
            toBeTested.x = toroidCoordinate(toBeTested.x, dir.dx);
            // if the terminal square is empty then gain in this direction is 0
            if (status.mapCurrent[toBeTested.y][toBeTested.x] == 0) {
                output.push(0);
                break;
            }
            // if the terminal square is of own color then calcute the gain in this direction
            if (status.mapCurrent[toBeTested.y][toBeTested.x] == playerToTest) {
                output.push(j - 1);
                break;
            }
        }
    }
    return output;
}

//Function to check if a player can move
function checkIfPlayerCanMove(status, player) {
    let reply = false;
    let possibleGain = 0;
    status.mapGains = initializeMap("gains");
    for (let i = 0; i < 8; i++) {
        if (reply) { break; }
        for (let j = 0; j < 8; j++) {
            if (status.mapPermitted[i][j] != 1) { continue; }
            possibleGain = calculateGain(status, { y: i, x: j }, player);
            if (possibleGain > 0) {
                reply = true;
                break;
            }
        }
    }
    return reply;
}

//Function to display current score
function displayScore(status) {
    for (let i = 1; i < 3; i++) {
        $(`#player${i} > .score`).text(status.score[i]);
        $(`#player${i} > .name`).text(status.name[i]);
    }
};

// Function to initialize the board, score, and player message 
function initializeBoardAndScore(status) {
    status.mapCurrent = initializeMap("current");
    status.mapPermitted = initializeMap("permitted");
    //status.mapGains = initializeMap("gains");
    status.score[1] = 2;
    status.score[2] = 2;
    status.player = 2; //pretend that the current player is 2 (the next one must be 1)
    updatePlayer(status);
    updateWebPage(status);
    $("#score-display").show();
    $("#start-buttons").hide();
    $("#message-section").show();
    displayScore(status);
}

//Function to initialize the map array
function initializeMap(typeOfMap) {
    class Gain {
        constructor() {
            this.totalgain = 0;
            this.gains = [];
        }
    }
    let output = [];
    let elementToAdd;
    if (typeOfMap == "gains") {
        elementToAdd = new Gain;
    } else {
        elementToAdd = 0;
    }
    for (let i = 0; i < 8; i++) {
        let mapRow = [];
        for (let j = 0; j < 8; j++) { mapRow[j] = elementToAdd; }
        output[i] = mapRow;
    }
    if (typeOfMap == "current") {
        output[3][3] = 1; output[3][4] = 2;
        output[4][3] = 2; output[4][4] = 1;
    }
    if (typeOfMap == "permitted") {
        output[2][2] = 1; output[2][3] = 1; output[2][4] = 1; output[2][5] = 1;
        output[3][2] = 1; output[3][3] = 2; output[3][4] = 2; output[3][5] = 1;
        output[4][2] = 1; output[4][3] = 2; output[4][4] = 2; output[4][5] = 1;
        output[5][2] = 1; output[5][3] = 1; output[5][4] = 1; output[5][5] = 1;
    }
    return output;
}

// Function to read a coordinate (x or y) of a square from the square's list of classes (inputClasses).
function readCoordinate(inputClasses, inputAxis) {
    for (let i of inputClasses) {
        if (i.length === 2 && i[0] === inputAxis) {
            let coordinate = parseInt(i[1]);
            if (Number.isInteger(coordinate) && coordinate > -1 && coordinate < 8) {
                return coordinate;
            }
        }
    }
}

// Function to set newColor ("black" or "white") to squareToBeChanged (an element that belongs classes .squareToBeChanged.y & .squareToBeChanged.x).
function setNewColor(squareToBeChanged, newColor) {
    let selector = `.y${squareToBeChanged.y}.x${squareToBeChanged.x}`;
    $(selector).removeClass("bg-white");
    $(selector).removeClass("bg-black");
    $(selector).removeClass("bg-green");
    $(selector).addClass("bg-" + newColor);
}

// Function to calculate a coordinate on toroid if the initial coordinate is c0 and the coordinate shift is dC
function toroidCoordinate(c0, dC) {
    return (c0 + dC + 8) % 8;
}

//Function to update colors on the web page using colorPalette and map
function updateWebPage(status) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            setNewColor({ y: i, x: j }, status.colors[status.mapCurrent[i][j]]);
        }
    }
}

// Function to update the mapCurrent when current player (status.player) clicks on square (clickedSquare.y, clickedSquare.x).
function updateMapCurrent(status, center) {
    status.mapCurrent[center.y][center.x] = status.player; //update color of the center square
    let gain = status.mapGains[center.y][center.x].gains; //a temporary short variable for an array with 8 gains in different directions
    //reverse the opponent's squares
    for (let i = 0; i < 8; i++) {
        if (gain[i] > 0) {
            let dir = status.basis[i];
            let toBeChanged = { y: center.y, x: center.x };
            for (let j = 0; j < gain[i]; j++) {
                toBeChanged.y = toroidCoordinate(toBeChanged.y, dir.dy);
                toBeChanged.x = toroidCoordinate(toBeChanged.x, dir.dx);
                status.mapCurrent[toBeChanged.y][toBeChanged.x] = status.player; //update color of the center square
            }
        }
    }
}

// Function to update the mapPermitted when current player (status.player) clicks on square (clickedSquare.y, clickedSquare.x).
function updateMapPermitted(status, center) {
    status.mapPermitted[center.y][center.x] = 2; //mark the "center" square as occupied
    squareToBeChecked = { x: 0, y: 0 };
    // Check all squares aroung the "center" square
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            // Calculate "classical" or "toroid" coordinates of the square to be chacked
            if (status.boardIsClassic) {
                squareToBeChecked.x = center.x + i;
                squareToBeChecked.y = center.y + j;
            } else {
                squareToBeChecked.x = toroidCoordinate(center.x, i);
                squareToBeChecked.y = toroidCoordinate(center.y, j);
            }
            // If out of board then check the next square
            if (status.boardIsClassic && (squareToBeChecked.x < 0 || squareToBeChecked.x > 7 || squareToBeChecked.y < 0 || squareToBeChecked.y > 7)) { continue; }
            // If the neighbour square was marked as unoccupied (status.mapPermitted == 0) then mark it as permitted for a move
            if (status.mapPermitted[squareToBeChecked.y][squareToBeChecked.x] == 0) { status.mapPermitted[squareToBeChecked.y][squareToBeChecked.x] = 1; }
        }
    }
};

// Function to update the mapPermitted when current player (status.player) clicks on square (clickedSquare.y, clickedSquare.x).
function updateMessage(status) {
    selector = "#message-content";
    $(selector).html(`Move of ${status.name[status.player]} (${status.colors[status.player]})`);
    $(selector).removeClass("font-white");
    $(selector).removeClass("font-black");
    $(selector).addClass("font-" + status.colors[status.player]);
}

// Function to pass the move to the opposite player
function updatePlayer(status) {
    let opponentPlayerCanMove = checkIfPlayerCanMove(status, status.player % 2 + 1);
    let selector = "#message-content";
    if (opponentPlayerCanMove) {
        status.player = status.player % 2 + 1;
        updateMessage(status);
    } else {
        let currentPlayerCanMove = checkIfPlayerCanMove(status, (status.player + 1) % 2 + 1);
        if (currentPlayerCanMove) {
            status.player = status.player;
            $(selector).html(`Move of Player${status.player} (${status.colors[status.player]}) again!`);
        } else {
            selector = "#message-section > div";
            let winMessage = "DRAW";
            if (status.score[1] > status.score[2]) { winMessage = `Player1 (${status.colors[status.player]}) WON!!!`; }
            if (status.score[1] < status.score[2]) { winMessage = `Player2 (${status.colors[status.player]}) WON!!!`; }
            $(selector).html(winMessage);
        }
    }
}

//Function to update score
function updateScore(status, center) {
    let changeScoreBy = status.mapGains[center.y][center.x].totalgain;
    if (status.player == 1) {
        status.score[1] += changeScoreBy + 1;
        status.score[2] -= changeScoreBy;
    }
    if (status.player == 2) {
        status.score[2] += changeScoreBy + 1;
        status.score[1] -= changeScoreBy;
    }
};