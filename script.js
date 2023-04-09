// Variables
const grid = document.getElementById("grid");
const clearBtn = document.getElementById("clear");
const startPathfindingBtn = document.getElementById("startPathfinding");

// Functions
function generateGrid(startRow = 0, startCol = 0, endRow = 19, endCol = 19) {
    grid.innerHTML = '';

    const numberOfRows = 20;
    const numberOfColumns = 20;

    for (let row = 0; row < numberOfRows; row++) {
        for (let col = 0; col < numberOfColumns; col++) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.dataset.row = row;
            square.dataset.col = col;

            // Set the start and end squares
            if (row === startRow && col === startCol) {
                square.classList.add("start");
                square.dataset.type = "start";
            } else if (row === endRow && col === endCol) {
                square.classList.add("end");
                square.dataset.type = "end";
            } else {
                square.dataset.type = "blank";
            }

            grid.appendChild(square);
        }
    }
}

function setObstacle(square) {
    square.classList.add("obstacle");
    square.classList.remove("path", "open", "closed");
    square.dataset.type = "obstacle";
}

function setBlank(square) {
    square.classList.remove("obstacle", "path", "open", "closed");
    square.dataset.type = "blank";
}

function clearPath() {
    const pathSquares = grid.querySelectorAll(".square.path");
    const openSquares = grid.querySelectorAll(".square.open");
    const closedSquares = grid.querySelectorAll(".square.closed");

    pathSquares.forEach((pathSquare) => {
        pathSquare.classList.remove("path");
    });

    openSquares.forEach((openSquare) => {
        openSquare.classList.remove("open");
    });

    closedSquares.forEach((closedSquare) => {
        closedSquare.classList.remove("closed");
    });
}



function clearGrid() {
    console.log("Clearing grid");

    const startNode = grid.querySelector('.square[data-type="start"]');
    const endNode = grid.querySelector('.square[data-type="end"]');

    const startRow = parseInt(startNode.dataset.row);
    const startCol = parseInt(startNode.dataset.col);

    const endRow = parseInt(endNode.dataset.row);
    const endCol = parseInt(endNode.dataset.col);

    generateGrid(startRow, startCol, endRow, endCol);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNode(row, col) {
    return grid.querySelector(`.square[data-row='${row}'][data-col='${col}']`);
}

function getNeighbors(node) {
    const neighbors = [];
    const row = parseInt(node.dataset.row);
    const col = parseInt(node.dataset.col);

    if (row > 0) neighbors.push(getNode(row - 1, col));
    if (col > 0) neighbors.push(getNode(row, col - 1));
    if (row < 19) neighbors.push(getNode(row + 1, col));
    if (col < 19) neighbors.push(getNode(row, col + 1));

    return neighbors;
}

async function startPathFinding() {
    console.log("StartingPathFinding");

    clearPath(); // Add this line to clear the previous path

    const startNode = grid.querySelector('.square[data-type="start"]');
    const endNode = grid.querySelector('.square[data-type="end"]');

    const path = await aStarAlgorithm(startNode, endNode);

    if (path) {
        for (const node of path) {
            if (node !== startNode && node !== endNode) {
                node.classList.remove("open");
                node.classList.add("path");
            }
            await sleep(10);
        }
    } else {
        alert("No path found!");
    }
}

async function aStarAlgorithm(startNode, endNode) {
    console.log("Started algorithm");
    const openSet = [startNode];
    const closedSet = [];
    const cameFrom = {};

    startNode.dataset.gCost = 0;
    startNode.dataset.hCost = euclideanDistance(startNode, endNode);
    startNode.dataset.fCost = startNode.dataset.hCost;

    while (openSet.length > 0) {
        openSet.sort((a, b) => parseFloat(a.dataset.fCost) - parseFloat(b.dataset.fCost));
        const currentNode = openSet.shift();

        if (currentNode === endNode) {
            console.log("Path found!")
            return reconstructPath(cameFrom, currentNode);
        }

        closedSet.push(currentNode);
        currentNode.classList.add("closed");

        for (const neighbor of getNeighbors(currentNode)) {
            if (closedSet.includes(neighbor) || neighbor.dataset.type === "obstacle") {
                continue;
            }

            const tentativeGCost = parseFloat(currentNode.dataset.gCost) + euclideanDistance(currentNode, neighbor);

            if (!openSet.includes(neighbor)) {
                openSet.push(neighbor);
                neighbor.classList.add("open");
            } else if (tentativeGCost >= parseFloat(neighbor.dataset.gCost)) {
                continue;
            }

            cameFrom[`${neighbor.dataset.row}-${neighbor.dataset.col}`] = currentNode;
            neighbor.dataset.gCost = tentativeGCost;
            neighbor.dataset.hCost = euclideanDistance(neighbor, endNode);
            neighbor.dataset.fCost = parseFloat(neighbor.dataset.gCost) + parseFloat(neighbor.dataset.hCost);

            await sleep(10);
        }
    }

    return null;
}

function euclideanDistance(nodeA, nodeB) {
    const rowDiff = parseInt(nodeA.dataset.row) - parseInt(nodeB.dataset.row);
    const colDiff = parseInt(nodeA.dataset.col) - parseInt(nodeB.dataset.col);
    return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
}

function reconstructPath(cameFrom, currentNode) {
    const path = [currentNode];
    while (`${currentNode.dataset.row}-${currentNode.dataset.col}` in cameFrom) {
        currentNode = cameFrom[`${currentNode.dataset.row}-${currentNode.dataset.col}`];
        path.unshift(currentNode);
    }
    return path;
}

let draggingStartOrEnd = false;
let placingObstacles = false;
let removingObstacles = false;
let mouseMoving = false;

function handleMouseDown(event) {
    const square = event.target;
    if(!square){
        const squareSize = 25; // Replace this with the actual size of your squares (including borders)
        const gridRect = grid.getBoundingClientRect();
        const offsetX = event.clientX - gridRect.left;
        const offsetY = event.clientY - gridRect.top;

        const row = Math.floor(offsetY / squareSize);
        const col = Math.floor(offsetX / squareSize);

        square = getNode(row, col);
    }
    const type = square.dataset.type;

    if (type === "start" || type === "end") {
        draggingStartOrEnd = true;
        grid.dataset.dragging = type;
        grid.dataset.draggingOriginalRow = square.dataset.row;
        grid.dataset.draggingOriginalCol = square.dataset.col;
    } else {
        if (type === "blank" || type === "path" || type === "open" || type === "closed") {
            placingObstacles = true;
            setObstacle(square);
        } else if (type === "obstacle") {
            removingObstacles = true;
            setBlank(square);
        }
    }
}

async function handleStartOrEndMove(square) {
    const type = square.dataset.type;

    if (type !== "obstacle" && type !== "start" && type !== "end") {
        const previousStartOrEndSquare = grid.querySelector(
            `.square[data-type="${grid.dataset.dragging}"]`
        );

        previousStartOrEndSquare.classList.remove(grid.dataset.dragging);
        previousStartOrEndSquare.dataset.type = "blank";

        square.classList.add(grid.dataset.dragging);
        square.dataset.type = grid.dataset.dragging;
    }
}

async function handleMouseUp(event) {
    if (draggingStartOrEnd) {
        await handleStartOrEndMove(event.target);
    }

    draggingStartOrEnd = false;
    placingObstacles = false;
    removingObstacles = false;
}


async function handleMouseMove(event) {
    if (mouseMoving) return;
    mouseMoving = true;

    const square = event.target;
    const type = square.dataset.type;

    if (draggingStartOrEnd) {
        await handleStartOrEndMove(square);
    } else {
        if (placingObstacles && type === "blank") {
            setObstacle(square);
        } else if (removingObstacles && type === "obstacle") {
            setBlank(square);
        }
    }

    mouseMoving = false;
}

// Event Listeners
grid.addEventListener("mousedown", handleMouseDown);
grid.addEventListener("mouseup", handleMouseUp);
grid.addEventListener("mousemove", handleMouseMove);
clearBtn.addEventListener("click", clearGrid);
startPathfindingBtn.addEventListener("click", startPathFinding);

// Initialization
generateGrid();
