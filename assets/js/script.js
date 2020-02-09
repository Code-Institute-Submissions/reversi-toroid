$(document).ready(function () {

    const colors = ["green", "white", "black"]; //colors for players
    const basis = [
        { dy: -1, dx: 0 },
        { dy: -1, dx: 1 },
        { dy: 0, dx: 1 },
        { dy: 1, dx: 1 },
        { dy: 1, dx: 0 },
        { dy: 1, dx: -1 },
        { dy: 0, dx: -1 },
        { dy: -1, dx: -1 },
    ]; //basis for different directions

    let currentPlayer = 0; //current player to move: 0 - nobody, 1 - white, 2 - black
    let mapArray = []; //map for the board


    //react to "START GAME" button
    $("#start-game").click(function () { startGame(); });

    //react to click on a square
    $(".square").click(function () {
        //read coordinates of the clicked square
        let currentClasses = this.classList;
        let clickedSquare = {
            y: readCoordinate(currentClasses, "y"),
            x: readCoordinate(currentClasses, "x"),
        }

        //check if the clicked square is already of the "clicking" color
        if (mapArray[clickedSquare.y][clickedSquare.x] != 0 || currentPlayer == 0) {
            alert("NOT ALLOWED!");
            return;
        }
        //calculate gain in all 8 possible directions for clickedSquare clicked by currentPlayer
        let possibleGain = calculateGain(clickedSquare, currentPlayer);
        if (possibleGain.reduce( (a,b) => a + b, 0) == 0) { alert("NOT ALLOWED!"); return; } //if gain is 0 then the move is not allowed

        //update the mapArray
        updateMapArray(clickedSquare, possibleGain, currentPlayer);

        //change color of the clicked square
        updateColors();

        //pass to the opposite player
        updatePlayer();
    });

    //Function to start a new game
    function startGame() {
        mapArray = initializeMap();
        updatePlayer();
        updateColors();
        $("#start-game").hide();
        $("#message-player").show();
    }

    //Function to pass the move to the opposite player
    function updatePlayer() {
        currentPlayer = currentPlayer % 2 + 1;
        let selector = "#message-player h1";
        $(selector).html(`Move of Player${currentPlayer}`);
        $(selector).removeClass("font-white");
        $(selector).removeClass("font-black");
        $(selector).addClass("font-" + colors[currentPlayer]);
    }

    // Function to update the mapArray when currentPlayer clicks on square (clickedSquare.y, clickedSquare.x).
    function updateMapArray(center, gain, newColor) {
        mapArray[center.y][center.x] = newColor; //update color of the center square
        //reverse the opponent's squares
        for (i = 0; i < 8; i++) {
            if (gain[i] > 0) {
                let dir = basis[i];
                let toBeChanged = { y: center.y, x: center.x };
                for (j = 0; j < gain[i]; j++) {
                    toBeChanged.y = (toBeChanged.y + dir.dy + 8) % 8;
                    toBeChanged.x = (toBeChanged.x + dir.dx + 8) % 8;
                    mapArray[toBeChanged.y][toBeChanged.x] = newColor; //update color of the center square
                }
            }
        }
    }

    // Function to calculate gain from center of centerColor with (centerX, centerY) in direction (dir.dy, dir.dx)
    function calculateGain(center, centerColor) {
        let output = [];
        for (let i = 0; i < 8; i++) {
            let dir = basis[i];
            let toBeTested = { y: center.y, x: center.x };
            for (let j = 1; j < 8; j++) {
                toBeTested.y = (toBeTested.y + dir.dy + 8) % 8;
                toBeTested.x = (toBeTested.x + dir.dx + 8) % 8;
                if (mapArray[toBeTested.y][toBeTested.x] == 0) {
                    output.push(0);
                    break;
                }
                if (mapArray[toBeTested.y][toBeTested.x] == centerColor) {
                    output.push(j - 1);
                    break;
                }
            }
        }
        return output;
    }

    function updateColors() {
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                setNewColor({ y: i, x: j }, colors[mapArray[i][j]]);
            }
        }
    }

    // Function to set newColor to squareToBeChanged ({:y,:x}).
    function setNewColor(squareToBeChanged, newColor) {
        let selector = `.y${squareToBeChanged.y}.x${squareToBeChanged.x}`;
        $(selector).removeClass("bg-white");
        $(selector).removeClass("bg-black");
        $(selector).removeClass("bg-green");
        $(selector).addClass("bg-" + newColor);
    }

    //Function to initialize the map array
    function initializeMap() {
        let output = [];
        for (i = 0; i < 8; i++) {
            let mapRow = [];
            for (j = 0; j < 8; j++) { mapRow[j] = 0; }
            output[i] = mapRow;
        }
        output[3][3] = 1;
        output[4][4] = 1;
        output[3][4] = 2;
        output[4][3] = 2;
        return output;
    }

    // Function to read a coordinate (x or y) of a square from the square's list of classes.
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

});