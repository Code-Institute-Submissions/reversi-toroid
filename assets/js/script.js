$(document).ready(function () {

    //The main data object with constants and main variables
    let state = {
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
        player: 0, //current player to move: 0 - nobody, 1 - white, 2 - black
        score1: 2, //current score of player 1
        score2: 2, //current score of player 2
        mapCurrent: [], //map for the board: 0 - nobody, 1 - white, 2 - black
        mapPermitted: [], //map for permitted moves: 0 - empty, 1 - permitted, 2 - occupied
    }

    //react to "START GAME" button
    $("button").click(function () {
        state.mapCurrent = initializeMap("current");
        state.mapPermitted = initializeMap("permitted")
        updatePlayer(state);
        updateWebPage(state);
        $("#myScore").show();
        $("#myButtons").hide();
        $("#message-player").show();
        displayScore(state);
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
        if (state.mapCurrent[clickedSquare.y][clickedSquare.x] != 0 || state.player == 0) {
            alert("Not a valid move. Click on an EMPTY square!!!");
            return;
        }
        //calculate gain in all 8 possible directions for clickedSquare clicked by current player (state.player)
        let possibleGain = calculateGain(state, clickedSquare);
        if (possibleGain.reduce((a, b) => a + b, 0) == 0) { alert("Not a valid move! You MUST capture/flip AT LEAST 1 opponent square!!!"); return; } //if gain is 0 then the move is not allowed

        //update the mapCurrent
        updateMap(state, clickedSquare, possibleGain);
        //change color of the clicked square
        updateWebPage(state);

        //update score
        updateScore(state, possibleGain);
        //change color of the clicked square
        displayScore(state);

        //pass to the opposite player
        updatePlayer(state);

    });

});


// Function to calculate gain from center of centerColor with (centerX, centerY) in direction (dir.dy, dir.dx) using an array with 8 direction vectors (basis)
function calculateGain(state, center) {
    let output = [];
    for (let i = 0; i < 8; i++) {
        let dir = state.basis[i];
        let toBeTested = { y: center.y, x: center.x };
        for (let j = 1; j < 8; j++) {
            toBeTested.y = (toBeTested.y + dir.dy + 8) % 8;
            toBeTested.x = (toBeTested.x + dir.dx + 8) % 8;
            if (state.mapCurrent[toBeTested.y][toBeTested.x] == 0) {
                output.push(0);
                break;
            }
            if (state.mapCurrent[toBeTested.y][toBeTested.x] == state.player) {
                output.push(j - 1);
                break;
            }
        }
    }
    return output;
}

//Function to display current score
function displayScore(state) {
    $("#player1-score").text(state.score1);
    $("#player2-score").text(state.score2);
};

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
function updateWebPage(state) {
    for (i = 0; i < 8; i++) {
        for (j = 0; j < 8; j++) {
            setNewColor({ y: i, x: j }, state.colors[state.mapCurrent[i][j]]);
        }
    }
}

// Function to update the mapCurrent when current player (state.player) clicks on square (clickedSquare.y, clickedSquare.x).
function updateMap(state, center, gain) {
    state.mapCurrent[center.y][center.x] = state.player; //update color of the center square
    //reverse the opponent's squares
    for (i = 0; i < 8; i++) {
        if (gain[i] > 0) {
            let dir = state.basis[i];
            let toBeChanged = { y: center.y, x: center.x };
            for (j = 0; j < gain[i]; j++) {
                toBeChanged.y = (toBeChanged.y + dir.dy + 8) % 8;
                toBeChanged.x = (toBeChanged.x + dir.dx + 8) % 8;
                state.mapCurrent[toBeChanged.y][toBeChanged.x] = state.player; //update color of the center square
            }
        }
    }
}

//Function to pass the move to the opposite player
function updatePlayer(state) {
    state.player = state.player % 2 + 1;
    let selector = "#message-player h1";
    $(selector).html(`Move of Player${state.player} (${state.colors[state.player]})`);
    $(selector).removeClass("font-white");
    $(selector).removeClass("font-black");
    $(selector).addClass("font-" + state.colors[state.player]);
}

//Function to update score
function updateScore(state, possibleGain) {
    //console.log(possibleGain);
    let totatlGain = possibleGain.reduce((a, b) => a + b, 0);
    if (state.player == 1) {
        state.score1 += totatlGain + 1;
        state.score2 -= totatlGain;
    }
    if (state.player == 2) {
        state.score2 += totatlGain + 1;
        state.score1 -= totatlGain;
    }
};