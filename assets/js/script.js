$(document).ready(function () {

    // The main data object with constants and main variables.
    let status = {
        boardIsClassic: false, //flag for type of game rules: true - classic game on a square board, false - game on a toroid board
        playerIsHuman: [false, true, true], //[unused, player 1 is human (true/false), player 2 is human (true/false)]
        basis: [
            { dy: -1, dx: 0 },
            { dy: -1, dx: 1 },
            { dy: 0, dx: 1 },
            { dy: 1, dx: 1 },
            { dy: 1, dx: 0 },
            { dy: 1, dx: -1 },
            { dy: 0, dx: -1 },
            { dy: -1, dx: -1 },
        ], //basis for 8 different directions
        colors: ["green", "black", "white"], //colors for players        
        player: 0, //current player to move: 0 - nobody, 1 - black, 2 - white
        score: [0, 2, 2], //[unused, score of player 1, score of player 2]
        name: ["", "Player1", "Player2"], //[unused, name of player 1, name of player 2]
        aiLevel: 0, //AI level; must be either 1, or 2, or 3, or 4; level 0 is default for no AI player
        minAiLevel: 1, //minimal AI level
        maxAiLevel: 2, //maximal AI level
        mapCurrent: [], //map for the board: 0 - nobody, 1 - white, 2 - black
        mapPermitted: [], //map for permitted moves: 0 - empty, 1 - permitted, 2 - occupied
        totalCalculatedGain: 0, // buffer variable for total potentintial gain obtained if a particular square is clicked
        individualCalculatedGains: [], // buffer array for individual potentintial gains in 8 directions obtained if a particular square is clicked
    }

    // React to clicking the "Home" button (reset to original view).
    $("#nav-home").click(function () {
        for (let i = 0; i < 8; i++) { for (let j = 0; j < 8; j++) { status.mapCurrent[i][j] = 0; } } //set all squares to unoccupied (=0)
        updateBoardDisplay(status); // Update colors on thre board according to the reset state.
        $("header > p").text("Reversi Game");
        $("#score-display").hide();
        $("#start-buttons").show();
        $("#message-section").hide();
    });

    // React to clicking the "Home" button (reset to original view).
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

    // React to choosing the "classic" version of Reversi.
    $("#start-classic").click(function () {
        $("header > p").text("Classic Reversi");
        status.boardIsClassic = true;
        initializeBoardAndScore(status);
    });

    // React to choosing the "toroid" version of Reversi .
    $("#start-toroid").click(function () {
        $("header > p").text("Reversi-on-Toroid");
        status.boardIsClassic = false;
        initializeBoardAndScore(status);
    });

    // React to clicking the score frame of player 1 or 2 to change the player's name.
    $(".score-frame").click(function () {
        let messageBuffer = $("#message-content").html(); // Save current message to restore it after setting a new name.
        let elementID = $(this).attr("id");
        let lastIDSymbol = elementID[elementID.length - 1];
        let playerNumber = parseInt(lastIDSymbol);
        $("#message-content").html(`<span>Enter new name for Player ${playerNumber}: </span><input id="new-name" type="text" value="AI (level 1)" size="12"><button id="name-ok">OK</button>`);

        // Save the new name and restore current message
        $("#name-ok").click(function () {
            let newName = $("#new-name").val();
            if (setNewName(status, newName, playerNumber) == -100) { return; }; // If something went wrong, exit the function without doing anything.
            displayScore(status);
            $("#message-content").html(messageBuffer);
            updateMessage(status);
            // If the name of the current player is changed then pretend that the current is opponent and force update the current player (to make it move). 
            if (playerNumber == status.player) {
                status.player = status.player % 2 + 1;
                updatePlayer(status);
            }
        });

    });

    // React to click on a square (a human move).
    $(".square").click(function () {

        // Read coordinates of the clicked square.
        let currentClasses = this.classList;
        let clickedSquare = {
            y: readCoordinate(currentClasses, "y"),
            x: readCoordinate(currentClasses, "x"),
        }

        // Check if the clicked square is already of the "clicking" color...
        if (status.mapCurrent[clickedSquare.y][clickedSquare.x] != 0 || status.player == 0) {
            alert("Not a valid move. Click on an EMPTY square!!!"); // ... if so, show an alert and do not react.
            return;
        }

        // Calculate gain in all 8 possible directions for clickedSquare clicked by current player (status.player) and check that the move is valid.
        if (calculateGain(status, clickedSquare, status.player) == 0) {
            alert("Not a valid move! You MUST capture/flip AT LEAST 1 opponent square!!!"); // ... if not, show an alert and do not react.
            return;
        }
        
        updateMapCurrent(status, clickedSquare); // Update "status.mapCurrent".
        updateMapPermitted(status, clickedSquare);  // Update "status.mapPermitted".
        updateBoardDisplay(status); // Update colors on the board according to the move.

        updateScore(status, clickedSquare); // Update score.
        displayScore(status); // Display the current score.

        updatePlayer(status); // Pass move to the opposite player.
    });

});


/* Function to calculate potential gain if "playerToTest" clicks a square "center".
    It saves gains in individual 8 directions in "status.individualCalculatedGains", and the total gain in "status.totalCalculatedGain".
    The function returns the total gain. */
function calculateGain(status, center, playerToTest) {
    let potentialGains = status.boardIsClassic ? calculateGainClassic(status, center, playerToTest) : calculateGainToroid(status, center, playerToTest);
    status.individualCalculatedGains = potentialGains;
    status.totalCalculatedGain = potentialGains.reduce((a, b) => a + b, 0);
    return status.totalCalculatedGain;
}

// Function calculates gain if "playerToTest" clicks the "center" square for Classic rules.
function calculateGainClassic(status, center, playerToTest) {
    let output = [];
    for (let i = 0; i < 8; i++) {
        let dir = status.basis[i];
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

// Function calculates gain if "playerToTest" clicks the "center" square for Reversi-on-Toroid rules.
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

//Function checks if "player" can move.
function checkIfPlayerCanMove(status, player) {
    let reply = false;
    for (let i = 0; i < 8; i++) {
        if (reply) { break; }
        for (let j = 0; j < 8; j++) {
            if (status.mapPermitted[i][j] != 1) { continue; }
            let totalPotentialGain = calculateGain(status, { y: i, x: j }, player);
            if (totalPotentialGain > 0) {
                reply = true;
                break;
            }
        }
    }
    return reply;
}

// Function displays the current score.
function displayScore(status) {
    for (let i = 1; i < 3; i++) {
        $(`#player${i} > .score`).text(status.score[i]);
        $(`#player${i} > .name`).text(status.name[i]);
    }
};

// Function initializes the board, score, and player message.
function initializeBoardAndScore(status) {
    status.mapCurrent = initializeMap("current");
    status.mapPermitted = initializeMap("permitted");
    status.score[1] = 2;
    status.score[2] = 2;
    status.player = 2; // Pretend that the current player is 2 (the next one must be 1).
    updatePlayer(status);
    updateBoardDisplay(status);
    $("#score-display").show();
    $("#start-buttons").hide();
    $("#message-section").show();
    displayScore(status);
}

// Function initializes a map array (there are 2 possible maps: "current" and "permitted").
function initializeMap(typeOfMap) {
    let output = [];
    // Create an array and initialize all its elements to 0.
    for (let i = 0; i < 8; i++) {
        let mapRow = [];
        for (let j = 0; j < 8; j++) { mapRow[j] = 0; }
        output[i] = mapRow;
    }
    // For "current" map set initial position: 2 black and 2 white squares.
    if (typeOfMap == "current") {
        output[3][3] = 1; output[3][4] = 2;
        output[4][3] = 2; output[4][4] = 1;
    }
    // For "permitted" map set initial position: inner 2x2 squares are occupied (=2), their neighbours are permitted (=1).
    if (typeOfMap == "permitted") {
        output[2][2] = 1; output[2][3] = 1; output[2][4] = 1; output[2][5] = 1;
        output[3][2] = 1; output[3][3] = 2; output[3][4] = 2; output[3][5] = 1;
        output[4][2] = 1; output[4][3] = 2; output[4][4] = 2; output[4][5] = 1;
        output[5][2] = 1; output[5][3] = 1; output[5][4] = 1; output[5][5] = 1;
    }
    return output;
}

// Function checks if the next player is AI, and if so makes it move.
function potentialAiMove(status) {
    if (status.playerIsHuman[status.player]) { return; } // The function will not be executed if the current player is human.
    let potentialY = [];
    let potentialX = [];
    let potentialGain = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (status.mapPermitted[i][j] == 1) {
                let buffer = calculateGain(status, { y: i, x: j }, status.player);
                potentialY.push(i);
                potentialX.push(j);
                potentialGain.push(buffer);
            }
        }
    }
    // If "aiLevel" is at 2 then consider only moves with maximal gain.
    if (status.aiLevel == 2) {
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

    calculateGain(status, clickedSquare, status.player); // Calculate gain in all 8 possible directions for "clickedSquare" clicked by the current player ("status.player").
    updateMapCurrent(status, clickedSquare);  // Update "status.mapCurrent".
    updateMapPermitted(status, clickedSquare); // Update "status.mapPermitted".
    updateBoardDisplay(status); // Update colors on the board according to the move.

    updateScore(status, clickedSquare); // Update score.
    displayScore(status); // Display the current score.

    updatePlayer(status); // Pass move to the opposite player.
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
function setNewName(status, newName, playerNumber) {
    let opponentPlayerNumber = playerNumber % 2 + 1;
    let newNameStartsWith = newName.slice(0, 10);
    let newNameEndsWith = newName.slice(11, 12);
    if (newNameStartsWith == "AI (level ") {
        if (newNameEndsWith != ')') {
            alert("The AI level looks strange. It MUST be not lower than 1 and no higher than 4.");
            return -100;
        }
        if (!status.playerIsHuman[opponentPlayerNumber]) {
            alert("At present there MUST be at least 1 HUMAN player");
            return -100;
        } else {
            let newAiLevel = newName.charCodeAt(10) - 48;
            if (newAiLevel < status.minAiLevel || newAiLevel > status.maxAiLevel) {
                alert(`At present minimal AI level is ${status.minAiLevel} and maximal is ${status.maxAiLevel}. While you try to set it to ${newAiLevel}.`);
                return -100;
            } else {
                status.playerIsHuman[playerNumber] = false;
                status.aiLevel = newAiLevel;
            }
        }
    } else {
        status.playerIsHuman[playerNumber] = true;
    }
    status.name[playerNumber] = newName;
}

// Function calculates a coordinate on toroid if the initial coordinate is "c0" and the coordinate shift is "dC".
function toroidCoordinate(c0, dC) {
    return (c0 + dC + 8) % 8;
}

// Function updates "status.mapCurrent" when the current player ("status.player") clicks on a "center" square (center.y, center.x).
function updateMapCurrent(status, center) {
    status.mapCurrent[center.y][center.x] = status.player; //update color of the center square
    let gain = status.individualCalculatedGains; //a temporary short variable for an array with 8 gains in different directions
    
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

// Function updates "status.mapPermitted" when the current player ("status.player") clicks on a "center" square (center.y, center.x).
function updateMapPermitted(status, center) {
    status.mapPermitted[center.y][center.x] = 2; //mark the "center" square as occupied
    squareToBeChecked = { x: 0, y: 0 };
    // Check all squares aroung the "center" square
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            // Calculate "classical" or "toroid" coordinates of the square to be checked
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

// Function updates the message when current player (status.player) clicks on square.
function updateMessage(status) {
    selector = "#message-content";
    $(selector).html(`Move of ${status.name[status.player]} (${status.colors[status.player]})`);
    $(selector).removeClass("font-white");
    $(selector).removeClass("font-black");
    $(selector).addClass("font-" + status.colors[status.player]);
}

// Function passes the move to the opposite player, or gives the current player the right to move again, or finishes the game.
function updatePlayer(status) {
    let opponentPlayerCanMove = checkIfPlayerCanMove(status, status.player % 2 + 1);
    let selector = "#message-content";
    if (opponentPlayerCanMove) { // if the opponent player can move
        status.player = status.player % 2 + 1;
        updateMessage(status);
        potentialAiMove(status);
    } else {
        let currentPlayerCanMove = checkIfPlayerCanMove(status, (status.player + 1) % 2 + 1);
        if (currentPlayerCanMove) { // if the opponent player cannot move but the current player can move again
            status.player = status.player;
            $(selector).html(`Move of Player${status.player} (${status.colors[status.player]}) again!`);
            potentialAiMove(status);
        } else { // if neither player can move
            selector = "#message-section > div";
            let winMessage = "DRAW";
            if (status.score[1] > status.score[2]) { winMessage = `${status.name[1]} (${status.colors[1]}) WON!!!`; }
            if (status.score[1] < status.score[2]) { winMessage = `${status.name[2]} (${status.colors[2]}) WON!!!`; }
            $(selector).html(winMessage);
        }
    }
}

// Function updates the score.
function updateScore(status, center) {
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

// Function updates colors on the board according to "status.mapCurrent".
function updateBoardDisplay(status) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            setNewColor({ y: i, x: j }, status.colors[status.mapCurrent[i][j]]);
        }
    }
}