// Definition of the variables

const rootElement = document.getElementById("root");

const gridElement = document.getElementById("grid");
const infoElement = document.getElementById("message");

const menuElement = document.getElementById("hub");

const sizeSelectEl = document.getElementById("select-size");
const difficultySelectEl = document.getElementById("select-difficulty");
const submitMenuEl = document.getElementById("submit-menu");
const formMenuEl = document.getElementById("menu-form");

const timerEl = document.getElementById("timer");

// ssMain is the stylesheet's index based on load order. See document.styleSheets. E.g. 0=reset.css, 1=main.css.
var ssMain = 0; // the index of the style sheet, here is it the first one
var cssRules = (document.all) ? 'rules': 'cssRules';

function changeCSSStyle(selector, cssProp, cssVal) {

  for (i=0, len=document.styleSheets[ssMain][cssRules].length; i<len; i++) {

    if (document.styleSheets[ssMain][cssRules][i].selectorText === selector) {
      document.styleSheets[ssMain][cssRules][i].style[cssProp] = cssVal;
      return;
    }
  }
}

/*
Tiny        10x10
Small       20x20
Medium      30x30
Large       50x50
Gigantic    100x100 (long to load)

Very easy   10%
Easy        15%
Hard        25%
Very hard   33%
*/

const DIFFICULTY = {
    VERY_EASY: 0.10,
    EASY: 0.15,
    HARD: 0.25,
    VERY_HARD: 0.33
}

const SIZE = {
    TINY: 10,
    SMALL: 20,
    MEDIUM: 30,
    LARGE: 50,
    GIGANTIC: 100
}

const STATE = {
    HIDDEN: -1,
    FLAGGED: -2,
    REVEALED: -3
}

const LONGPRESS_DURATION = 250;

const colorsBasedOnNumber = {
    0: "transparent",
    1: "blue",
    2: "green",
    3: "red",
    4: "darkblue",
    5: "darkred",
    6: "turquoise",
    7: "blueviolet",
    8: "black"
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

// Run a function for every adjacent neighbour
function propagateToNeighbours(i, j, width, height, func) {
    if(i > 0) {
        let currentRow = i - 1;
        if(j > 0) {
            func(currentRow, j - 1);
        }
        if(j < width - 1) {
            func(currentRow, j + 1);
        }
        func(currentRow, j);
    }
    if(i < height - 1) {
        let currentRow = i + 1;
        if(j > 0) {
            func(currentRow, j - 1);
        }
        if(j < width - 1) {
            func(currentRow, j + 1);
        }
        func(currentRow, j);
    }
    if(j > 0) {
        func(i, j - 1);
    }
    if(j < width - 1) {
        func(i, j + 1);
    }
}

const displayHub = () => {
    const sizeSelectEl = document.getElementById("select-size");
const difficultySelectEl = document.getElementById("select-difficulty");
const submitMenuEl = document.getElementById("submit-menu");

    formMenuEl.onsubmit = (e) => {

        // Get the constants value
        let size = undefined;
        let difficulty = undefined;

        switch(sizeSelectEl.value) {
            case "tiny":
                size = SIZE.TINY;
                gridElement.style.fontSize = "3rem";
                // gridElement.style.width = "";
                // gridElement.style.height = "";
                break;
            case "small":
                size = SIZE.SMALL;
                gridElement.style.fontSize = "2.5rem";
                // gridElement.style.width = "";
                // gridElement.style.height = "";
                break;
            case "medium":
                size = SIZE.MEDIUM;
                gridElement.style.fontSize = "1.75rem";
                // gridElement.style.width = "";
                // gridElement.style.height = "";
                break;
            case "large":
                size = SIZE.LARGE;
                gridElement.style.fontSize = "1.5rem";
                // gridElement.style.width = "";
                // gridElement.style.height = "";
                break;
            case "gigantic":
                size = SIZE.GIGANTIC;
                gridElement.style.fontSize = "1rem";
                // gridElement.style.width = "";
                // gridElement.style.height = "";
                break;
            default:
                size = SIZE.TINY;
                gridElement.style.fontSize = "3rem";
                // gridElement.style.width = "";
                // gridElement.style.height = "";
                break;
        }

        switch(difficultySelectEl.value) {
            case "veryeasy":
                difficulty = DIFFICULTY.VERY_EASY;
                break;
            case "easy":
                difficulty = DIFFICULTY.EASY
                break;
            case "hard":
                difficulty = DIFFICULTY.HARD
                break;
            case "veryhard":
                difficulty = DIFFICULTY.VERY_HARD
                break;
            default:
                difficulty = DIFFICULTY.VERY_EASY
                break;
        }

        // Hide the menu, show the grid
        menuElement.style.display = "none";
        rootElement.style.display = "block";

        // Start the game
        setupGame(size, difficulty);

        e.preventDefault();
    };

}

const setupGame = (size, difficulty) => {
    let width = size;
    let height = size;

    let percentageOfBombs = difficulty;

    let nbBombs = Math.floor(percentageOfBombs * width * height);

    let bombsStillHidden = nbBombs;
    let tilesStillHidden = width * height - nbBombs;

    var playable = false;

    var delay; // The current delay for the click
    var clickable = true;

    // Set up the grid

    gridElement.style.cssText += `grid-template-columns: repeat(${width}, 1fr);
    grid-template-rows: repeat(${height}, 1fr); aspect-ratio: ${width}/${height}`;

    let tilesEl = new Array(height);
    let tiles = new Array(height);
    let tilesState = new Array(height);

    let timerInterval = undefined;
    let timerValue = 0;

    const increaseCounter = (i, j) => {
        if(tiles[i][j] > -1) {
            tiles[i][j]++;
        }
    }

    const displayMessage = (message) => {
        infoElement.innerText = message;
    }

    const maybeWin = () => {
        if(bombsStillHidden == 0 && tilesStillHidden == 0) {
            playable = false;
            alert(`Well played, you won in ${timerValue} seconds!`);
        }
    }

    const lose = () => {
        alert("Game over... That was a bomb...");
        displayMessage(`GAME OVER`);
        window.location.reload();
    }

    const revealTile = (i, j) => {
        tilesEl[i][j].classList.remove("hidden");
        if(tilesState[i][j] != STATE.REVEALED) {
            tilesStillHidden--;
        }
        tilesState[i][j] = STATE.REVEALED;
        tilesEl[i][j].style.color = colorsBasedOnNumber[tiles[i][j]];
        tilesEl[i][j].style.borderColor = "black";
        // Change the color of the tile depending on the number of adjacent bombs
    }

    const fullArray = () => {
        for(let line = 0; line < height; line++) {
            let newLine = new Array(width);
            let newLineData = new Array(width);
            let newLineState = new Array(width);
            for(let col = 0; col < width; col++) {
                newTileEl = document.createElement("div");
                newTileEl.classList.add("tile");
                newTileEl.classList.add("hidden");
                gridElement.appendChild(newTileEl);
                newTileEl.style.cssText += `grid-column: ${col+1}; grid-row: ${line+1}`;
                newLine[col] = newTileEl;
                newLineData[col] = 0;
                newLineState[col] = STATE.HIDDEN;
            }
            tilesEl[line] = newLine;
            tiles[line] = newLineData;
            tilesState[line] = newLineState;
        }
    }

    const generateBombs = () => {
        for(let n = 0; n < nbBombs; n++) {
            var randomRow = -1;
            var randomCol = -1;
            do {
                randomRow = randomIntFromInterval(0, height - 1);
                randomCol = randomIntFromInterval(0, width - 1);
                if(tiles[randomRow][randomCol] < 0) {
                    randomRow = -1;
                    randomCol = -1;
                }
                // Test if there are too much bombs ?
            } while (randomRow < 0 || randomCol < 0);
            // Increase the counters for every adjacent element
            // The counting doesn't work really well
            tiles[randomRow][randomCol] = -1;
            propagateToNeighbours(randomRow, randomCol, width, height, increaseCounter);
            console.log(randomRow, randomCol);
        }
    }

    const addNumbersToTiles = () => {
        for(let line = 0; line < height; line++) {
            for(let col = 0; col < width; col++) {
                if(tiles[line][col] > -1) {
                    tilesEl[line][col].innerHTML = `<p>${tiles[line][col]}</p>`;
                }
            }
        }
    }

    // Set up the game
    const play = () => {
        playable = true; // Should readd new event listeners, if there are already there
        for(let line = 0; line < height; line++) {
            for(let col = 0; col < width; col++) {
                tilesEl[line][col].addEventListener('mousedown', function (e) {
                    if(!playable) return;
                    var _this = this; // That may be useuful next
                    delay = setTimeout(longpressed, LONGPRESS_DURATION);
                    function longpressed() {
                        if(tilesState[line][col] == STATE.REVEALED) return;
                        // A longclick means that the user adds a flag
                        if(tilesState[line][col] == STATE.FLAGGED) {
                            bombsStillHidden++;
                            tilesState[line][col] = STATE.HIDDEN;
                        } else {
                            bombsStillHidden--;
                            tilesState[line][col] = STATE.FLAGGED;
                        }
                        displayMessage(`There are still ${bombsStillHidden} bombs left and ${tilesStillHidden} tiles to discover.`);
                        tilesEl[line][col].classList.toggle("maybe");
                        tilesEl[line][col].classList.toggle("hidden");
                        clickable = false;
                        maybeWin();
                    }
                    
                }, true);
                
                tilesEl[line][col].addEventListener('mouseup', function (e) {
                    if(!playable) return;
                    // On mouse up, we know it is no longer a longpress
                    clearTimeout(delay);
                    if(clickable) {
                        // Do the function if it is not a longpress
                        console.log("short click"); // This is triggered after a long press
                        // add a class that hide the text !
                        if(tiles[line][col] < 0) {
                            console.log("That was a bomb, you lose...");
                            lose();
                        } else {                

                            // We show the tile's number if it's not already shown
                            if(tilesState[line][col] == STATE.REVEALED) return;

                            tilesEl[line][col].classList.remove("maybe");
                            if(tilesState[line][col] == STATE.FLAGGED) {
                                bombsStillHidden++;
                            }
                            revealTile(line, col);

                            // If is is 0, propagate
                            if(tiles[line][col] == 0) {

                                // Explore the whole grid to know which element to reveal
                                // Only change the style at the end of the loop
                                toReveal = []; // The tiles to reveal at the end

                                let toExplore = [];

                                let explored = Array(height).fill().map(() => Array(width).fill(false));

                                console.log("starting to propagate");
                                toExplore.push([line, col, true]);

                                let revealIfZero = (i, j) => {
                                    // We don't check if it's a bomb because if it was the case, the click wouldn't have propagated that far
                                    if(explored[i][j]) return;
                                    if(tilesState[i][j] == STATE.HIDDEN) {
                                        toExplore.push([i, j, tiles[i][j] == 0]);
                                    }
                                }
                                
                                // That works fine
                                while(toExplore.length > 0) {
                                    nextEl = toExplore.pop();
                                    nextRow = nextEl[0];
                                    nextCol = nextEl[1];

                                    // console.log(`taking the next tile to explore ${nextRow} ${nextCol}`);
                                    toReveal.push([nextRow, nextCol]);

                                    explored[nextRow][nextCol] = true;

                                    if(!nextEl[2]) continue; // The tile isn't 0

                                    propagateToNeighbours(nextRow, nextCol, width, height, revealIfZero);
        
                                }

                                // Graphical part

                                for(const t of toReveal) {
                                    revealTile(t[0],t[1]);
                                }
                            }
                            displayMessage(`There are still ${bombsStillHidden} bombs left and ${tilesStillHidden} tiles to discover.`);
                            setTimeout(maybeWin, 200);
                        }
                    }
                });
                
                tilesEl[line][col].addEventListener('mouseout', function (e) {
                    if(!playable) return; // That may be useless
                    clickable = true;   
                    clearTimeout(delay);
                });
            }
        }
    }

    const showEmptyTile = () => {
        // L'idée c'est de séléctionner une case vide et de mettre les bordures en rouge.
        var randomRow = -1;
        var randomCol = -1;
        do {
            randomRow = randomIntFromInterval(0, height - 1);
            randomCol = randomIntFromInterval(0, width - 1);
            if(tiles[randomRow][randomCol] != 0) {
                randomRow = -1;
                randomCol = -1;
            }
            // Test if there are too much bombs ?
        } while (randomRow < 0 || randomCol < 0);

        tilesEl[randomRow][randomCol].style.borderColor = "red";
    }

    const startTimer = () => {
        timerInterval = setInterval(() => {
            timerValue += 1;
            timerEl.innerText = `${String(timerValue).padStart(3, '0')}s`;
        }, 1000);
        timerEl.innerText = `${String(timerValue).padStart(3, '0')}s`;
    }

    fullArray();
    generateBombs();
    addNumbersToTiles();
    play();
    showEmptyTile();
    startTimer();

}


displayHub();

/*
TODO: Add a timer, and a highscores system
TODO: New game modes 3D or borderless
*/