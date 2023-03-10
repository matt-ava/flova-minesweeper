class Minesweeper {

  constructor(opts = {}) {
    let loadedData = {};

    //check if a game is saved in localStorage
    if (hasLocalStorage && localStorage["minesweeper.data"]) {
      loadedData = JSON.parse(localStorage["minesweeper.data"]);
      this.loadGame = true;
    }

    Object.assign(
      this,
      {
        flovatars: [],
        grid: [], //will hold an array of Cell objects
        minesFound: 0, //number of mines correctly flagged by user
        falseMines: 0, //number of mines incorrectly flagged
        status_msg: "Playing...", //game status msg, 'Won','Lost', or 'Playing'
        playing: true,
        movesMade: 0, //keep track of the number of moves
        options: {
          rows: 0, //number of rows in the grid
          cols: 0, //number of columns in the grid
          mines: 0 //number of mines in the grid
        }
      },
      { options: opts },
      loadedData
    );

    //validate options
    let rows = this.options["rows"];

    if (isNaN(rows)) {
      this.options["rows"] = 20;
    } else if (rows < 3) {
      this.options["rows"] = 3;
    } else if (rows > 100) {
      this.options["rows"] = 100;
    }

    let cols = this.options["cols"];

    if (isNaN(cols)) {
      this.options["cols"] = 30;
    } else if (cols < 3) {
      this.options["cols"] = 3;
    } else if (cols > 200) {
      this.options["cols"] = 200;
    }

    if (isNaN(this.options["mines"])) {
      this.options["mines"] = 30;
    }
    if (this.options["mines"] < 0) {
      this.options["mines"] = 1;
    } else if (
      this.options["mines"] >
      this.options["rows"] * this.options["cols"]
    ) {
      this.options["mines"] = this.options["rows"] * this.options["cols"];
    }

    if (this.loadGame) {
      this.load();
    } else {
      this.init();
    }
    this.save();
  }

  //setup the game grid
  init() {

    // Flovatars array mock
    // import Flovatar list from wallet TODO
    this.flovatars.push({
      id: 1433,
      url: 'https://images.flovatar.com/flovatar/svg/2687.svg',
    })

    // check flovatars min - max number
    // TODO

    //populate the grid with cells
    for (let r = 0; r < this.options["rows"]; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.options["cols"]; c++) {
        this.grid[r].push(new Cell({ xpos: c, ypos: r }));
      }
    }

    //randomly assign mines
    let assignedMines = 0;
    while (assignedMines < this.options.mines) {
      var rowIndex = Math.floor(Math.random() * this.options.rows);
      var colIndex = Math.floor(Math.random() * this.options.cols);
      //assign and increment if cell is not already a mine
      let cell = this.grid[rowIndex][colIndex];
      if (!cell.isMine) {
        cell.isMine = true;
        cell.value = "M";
        assignedMines++;
      }
    }

    //randomly assign Flovatars
    for (let i = 0; i < this.flovatars.length; i += 1) {
      let cell
      do {
        var rowIndex = Math.floor(Math.random() * this.options.rows);
        var colIndex = Math.floor(Math.random() * this.options.cols);
        //assign and increment if cell is not already a mine
        cell = this.grid[rowIndex][colIndex];
      } while (cell.isMine || cell.isFlova)

      cell.isFlova = true;
      cell.value = "F";
      cell.flova_id = this.flovatars[i].id
      cell.flova_url = this.flovatars[i].url
    }

    //update cell values, check for adjacent mines
    for (let r = 0; r < this.options["rows"]; r++) {
      for (let c = 0; c < this.options["cols"]; c++) {
        //no need to update mines
        if (!this.grid[r][c].isMine && !this.grid[r][c].isFlova) {
          let mineCount = 0,
            adjCells = this.getAdjacentCells(r, c);
          for (let i = adjCells.length; i--;) {
            if (adjCells[i].isMine) {
              mineCount++;
            }
          }

          this.grid[r][c].value = mineCount;
        }
      }
    }
    this.render();
  }

  //populate the grid from loaded data - need to create cell objects from raw data
  load() {
    for (let r = 0, r_len = this.grid.length; r < r_len; r++) {
      for (let c = 0, c_len = this.grid[r].length; c < c_len; c++) {
        this.grid[r][c] = new Cell(this.grid[r][c]);
      }
    }

    this.render();
  }

  //construct the DOM representing the grid
  render() {
    const gameContainer = document.getElementById("game_container");

    //clear old DOM
    gameContainer.innerHTML = "";

    let content = "";
    for (let r = 0; r < this.options.rows; r++) {
      content += '<div class="row">';
      for (let c = 0; c < this.options.cols; c++) {
        let cellObj = this.grid[r][c];

        //assign proper text and class to cells (needed when loading a game)
        let add_class = "",
          txt = "";
        if (cellObj.isFlagged) {
          add_class = "flagged";
        } else if (cellObj.isRevealed) {
          add_class = `revealed adj-${cellObj.value}`;
          txt = (!cellObj.isMine || !cellObj.isFlova ? cellObj.value || "" : "");
        }

        content += `<div class="cell ${add_class}" data-xpos="${c}" data-ypos="${r}">${txt}</div>`;
      }
      content += "</div>";
    }

    gameContainer.innerHTML = content;

    //setup status message
    document.getElementById("flova_count").textContent = 0
    document.getElementById("flova_total").textContent = this.flovatars.length
    document.getElementById("mine_count").textContent = this.options["mines"] - (this.falseMines + this.minesFound);
    document.getElementById("mine_total").textContent = this.options["mines"]
    document.getElementById("moves_made").textContent = this.movesMade;
    document.getElementById("game_status").textContent = this.status_msg;
    document.getElementById("game_status").style.color = "black";
  }

  //returns an array of cells adjacent to the row,col passed in
  getAdjacentCells(row, col) {
    let results = [];
    for (
      let rowPos = row > 0 ? -1 : 0;
      rowPos <= (row < this.options.rows - 1 ? 1 : 0);
      rowPos++
    ) {
      for (
        let colPos = col > 0 ? -1 : 0;
        colPos <= (col < this.options.cols - 1 ? 1 : 0);
        colPos++
      ) {
        results.push(this.grid[row + rowPos][col + colPos]);
      }
    }
    return results;
  }

  //reveal a cell
  revealCell(cell, firstIteration = true) {

    if (!cell.isRevealed && !cell.isFlagged && this.playing) {
      const cellElement = cell.getElement();

      if (cell.isFlova && firstIteration) {
        const flovaCount = document.getElementById("flova_count");
        flovaCount.textContent = parseFloat(flovaCount.textContent) + 1;

        cell.isRevealed = true;
        cellElement.classList.add("revealed");
        cellElement.classList.add("flovatar_cell");
        cellElement.classList.add("popup");

        cellElement.textContent = cell.flova_id
        const btn_name = `flova_button_${cell.flova_id}`
        cellElement.innerHTML = `
        <div id="${btn_name}" class="fit_container" onclick="showPopup(${cell.flova_id})">
           F
           <span class="popuptext" id="flova-popup-${cell.flova_id}">You found Flovatar #${cell.flova_id} <br> <img class="flova_popup" src="${cell.flova_url}"> </span>
        </div>`

        // cellElement.classList.remove("cell");
        // <img id="${btn_name}" class="fit_container" src="${cell.flova_url_low_res}">
        document.getElementById(btn_name).addEventListener("click", showPopup(cell.flova_id));
      }

      if (!cell.isFlova) {
        cell.isRevealed = true;
        cellElement.classList.add("revealed");
        cellElement.classList.add(`adj-${cell.value}`);
        cellElement.textContent = (!cell.isMine ? cell.value || "" : "");
      }
      //end the game if user clicked a mine
      if (cell.isMine) {
        this.status_msg = "Sorry, you lost!";
        this.playing = false;
        document.getElementById("game_status").textContent = this.status_msg;
        document.getElementById("game_status").style.color = "#EE0000";
      } else if (!cell.isFlagged && cell.value == 0) {
        //if the clicked cell has 0 adjacent mines, we need to recurse to clear out all adjacent 0 cells
        const adjCells = this.getAdjacentCells(cell.ypos, cell.xpos);
        for (let i = 0, len = adjCells.length; i < len; i++) {
          this.revealCell(adjCells[i], false);
        }
      }
    }
  }

  //flag a cell
  flagCell(cell) {
    if (!cell.isRevealed && this.playing) {
      const cellElement = cell.getElement(),
        mineCount = document.getElementById("mine_count");

      if (!cell.isFlagged) {
        cell.isFlagged = true;
        cellElement.classList.add("flagged");
        mineCount.textContent = parseFloat(mineCount.textContent) - 1;
        if (cell.isMine) {
          this.minesFound++;
        } else {
          this.falseMines++;
        }
      } else {
        cell.isFlagged = false;
        cellElement.classList.remove("flagged");
        cellElement.textContent = "";
        mineCount.textContent = parseFloat(mineCount.textContent) + 1;
        if (cell.isMine) {
          this.minesFound--;
        } else {
          this.falseMines--;
        }
      }
    }
  }

  //check if player has won the game
  validate() {
    const gameStatus = document.getElementById("game_status");

    if (this.minesFound === this.options.mines && this.falseMines === 0) {
      this.status_msg = "You won!!";
      this.playing = false;
      gameStatus.textContent = this.status_msg;
      gameStatus.style.color = "#00CC00";
    } else {
      this.status_msg = "Sorry, you lost!";
      this.playing = false;
      gameStatus.textContent = this.status_msg;
      gameStatus.style.color = "#EE0000";
    }
    this.save();
  }

  //debgugging function to print the grid to console
  gridToString() {
    let result = "";
    for (let r = 0, r_len = this.grid.length; r < r_len; r++) {
      for (let c = 0, c_len = this.grid[r].length; c < c_len; c++) {
        result += this.grid[r][c].value + " ";
      }
      result += "\n";
    }
    return result;
  }

  //save the game object to localstorage
  save() {
    if (!hasLocalStorage) {
      return false;
    } else {
      let data = JSON.stringify(this);
      localStorage["minesweeper.data"] = data;
    }
  }
}

//Cell constructor to represent a cell object in the grid
class Cell {
  constructor({
    xpos,
    ypos,
    value = 0,
    isMine = false,
    isRevealed = false,
    isFlagged = false
  }) {
    Object.assign(this, {
      xpos,
      ypos,
      value, //value of a cell: number of adjacent mines, F for flagged, M for mine
      isMine,
      isRevealed,
      isFlagged
    });
  }

  getElement() {
    return document.querySelector(
      `.cell[data-xpos="${this.xpos}"][data-ypos="${this.ypos}"]`
    );
  }
}

//create a new game
function newGame(opts = {}) {
  game = new Minesweeper(opts);
}

window.onload = function () {
  //attack click to new game button
  document
    .getElementById("new_game_button")
    .addEventListener("click", function () {
      // Initial settings
      const opts = {
        rows: 20,
        cols: 30,
        mines: 100,
      };

      if (hasLocalStorage) {
        localStorage.clear();
      }

      newGame(opts);
    });

  //attach click event to cells - left click to reveal
  document
    .getElementById("game_container")
    .addEventListener("click", function (e) {
      const target = e.target;

      if (target.classList.contains("cell")) {
        const cell =
          game.grid[target.getAttribute("data-ypos")][
          target.getAttribute("data-xpos")
          ];

        if (!cell.isRevealed && game.playing) {
          game.movesMade++;
          document.getElementById("moves_made").textContent = game.movesMade;
          game.revealCell(cell);
          game.save();
        }
      }
    });

  //right click to flag
  document
    .getElementById("game_container")
    .addEventListener("contextmenu", function (e) {
      e.preventDefault();
      const target = e.target;

      if (target.classList.contains("cell")) {
        const cell =
          game.grid[target.getAttribute("data-ypos")][
          target.getAttribute("data-xpos")
          ];
        if (!cell.isRevealed && game.playing) {
          game.movesMade++;
          document.getElementById("moves_made").textContent = game.movesMade;
          game.flagCell(cell);
          game.save();
        }
      }
    });

  //attach click to validate button
  document
    .getElementById("validate_button")
    .addEventListener("click", function () {
      game.validate();
    });

  //create a game
  newGame();
};

//global vars

var game;

/*
TODO
const connectWallet = () => {
  fcl
    .config()
    .put("accessNode.api", "https://rest-testnet.onflow.org")
    .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
    .put("app.detail.title", "FlovaMineSweeper");

  fcl.authenticate()
}
*/

const showPopup = (flova_id) => {
  console.log(flova_id)
  var popup = document.getElementById("flova-popup-" + flova_id);
  popup.classList.toggle("show");
};

//check support for local storage: credit - http://diveintohtml5.info/storage.html
const hasLocalStorage = (function () {
  try {
    return "localStorage" in window && window["localStorage"] !== null;
  } catch (e) {
    return false;
  }
})();


