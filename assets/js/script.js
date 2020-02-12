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
        player: 0, //current player to move: 0 - nobody, 1 - white, 2 - black
        score1: 2, //current score of player 1
        score2: 2, //current score of player 2
        mapCurrent: [], //map for the board: 0 - nobody, 1 - white, 2 - black
        mapPermitted: [], //map for permitted moves: 0 - empty, 1 - permitted, 2 - occupied
    }

    //react to choosing the "classic" version of Reversi 
    $("#start-classic").click(function () {
        $("header").text("Classic Reversi");
        status.boardIsClassic = true;
        initializeBoardAndScore(status);
    });

    //react to choosing the "toroid" version of Reversi 
    $("#start-toroid").click(function () {
        $("header").text("Reversi-on-Toroid");
        status.boardIsClassic = false;
        initializeBoardAndScore(status);
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
        let possibleGain = status.boardIsClassic ? calculateGainClassic(status, clickedSquare) : calculateGainToroid(status, clickedSquare);
        if (possibleGain.reduce((a, b) => a + b, 0) == 0) { alert("Not a valid move! You MUST capture/flip AT LEAST 1 opponent square!!!"); return; } //if gain is 0 then the move is not allowed

        //update the mapCurrent
        updateMap(status, clickedSquare, possibleGain);
        //change color of the clicked square
        updateWebPage(status);

        //update score
        updateScore(status, possibleGain);
        //change color of the clicked square
        displayScore(status);

        //pass to the opposite player
        updatePlayer(status);

    });

});

// Function to calculate gain from center of centerColor with (centerX, centerY) in direction (dir.dy, dir.dx) using an array with 8 direction vectors (basis)
// for Reversi-on-Toroid rules
function calculateGainClassic(status, center) {
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
            if (status.mapCurrent[toBeTested.y][toBeTested.x] == status.player) {
                output.push(j - 1);
                break;
            }
        }
    }
    return output;
}

// Function to calculate gain from center of centerColor with (centerX, centerY) in direction (dir.dy, dir.dx) using an array with 8 direction vectors (basis)
// for Reversi-on-Toroid rules
function calculateGainToroid(status, center) {
    let output = [];
    for (let i = 0; i < 8; i++) {
        let dir = status.basis[i];
        let toBeTested = { y: center.y, x: center.x };
        for (let j = 1; j < 8; j++) {
            toBeTested.y = (toBeTested.y + dir.dy + 8) % 8;
            toBeTested.x = (toBeTested.x + dir.dx + 8) % 8;
            // if the terminal square is empty then gain in this direction is 0
            if (status.mapCurrent[toBeTested.y][toBeTested.x] == 0) {
                output.push(0);
                break;
            }
            // if the terminal square is of own color then calcute the gain in this direction
            if (status.mapCurrent[toBeTested.y][toBeTested.x] == status.player) {
                output.push(j - 1);
                break;
            }
        }
    }
    return output;
}

//Function to display current score
function displayScore(status) {
    $("#player1-score").text(status.score1);
    $("#player2-score").text(status.score2);
};

// Function to initialize the board, score, and player message 
function initializeBoardAndScore(status) {
    status.mapCurrent = initializeMap("current");
    status.mapPermitted = initializeMap("permitted")
    updatePlayer(status);
    updateWebPage(status);
    $("#myScore").show();
    $("#myButtons").hide();
    $("#message-player").show();
    displayScore(status);
}

//Function to initialize the map array
function initializeMap(typeOfMap) {
    let output = [];
    for (i = 0; i < 8; i++) {
        let mapRow = [];
        for (j = 0; j < 8; j++) { mapRow[j] = 0; }
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
    for (i of inputClasses) {
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

//Function to update colors on the web page using colorPalette and map
function updateWebPage(status) {
    for (i = 0; i < 8; i++) {
        for (j = 0; j < 8; j++) {
            setNewColor({ y: i, x: j }, status.colors[status.mapCurrent[i][j]]);
        }
    }
}

// Function to update the mapCurrent when current player (status.player) clicks on square (clickedSquare.y, clickedSquare.x).
function updateMap(status, center, gain) {
    status.mapCurrent[center.y][center.x] = status.player; //update color of the center square
    //reverse the opponent's squares
    for (i = 0; i < 8; i++) {
        if (gain[i] > 0) {
            let dir = status.basis[i];
            let toBeChanged = { y: center.y, x: center.x };
            for (j = 0; j < gain[i]; j++) {
                toBeChanged.y = (toBeChanged.y + dir.dy + 8) % 8;
                toBeChanged.x = (toBeChanged.x + dir.dx + 8) % 8;
                status.mapCurrent[toBeChanged.y][toBeChanged.x] = status.player; //update color of the center square
            }
        }
    }
}

//Function to pass the move to the opposite player
function updatePlayer(status) {
    status.player = status.player % 2 + 1;
    let selector = "#message-player h1";
    $(selector).html(`Move of Player${status.player} (${status.colors[status.player]})`);
    $(selector).removeClass("font-white");
    $(selector).removeClass("font-black");
    $(selector).addClass("font-" + status.colors[status.player]);
}

//Function to update score
function updateScore(status, possibleGain) {
    //console.log(possibleGain);
    let totatlGain = possibleGain.reduce((a, b) => a + b, 0);
    if (status.player == 1) {
        status.score1 += totatlGain + 1;
        status.score2 -= totatlGain;
    }
    if (status.player == 2) {
        status.score2 += totatlGain + 1;
        status.score1 -= totatlGain;
    }
};