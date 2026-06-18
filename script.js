const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gestureText = document.getElementById("gesture");
const aiChoiceText = document.getElementById("aiChoice");
const resultText = document.getElementById("result");

const playerScoreText = document.getElementById("playerScore");

const aiScoreText = document.getElementById("aiScore");

const aiHandImg = document.getElementById("aiHandImg");

const gameMessage = document.getElementById("gameMessage");

const winSound = document.getElementById("winSound");

const loseSound = document.getElementById("loseSound");

const drawSound = document.getElementById("drawSound");
const playBtn = document.getElementById("playBtn");
const roundText = document.getElementById("roundText");

let currentGesture = "Tidak Terdeteksi";

let round = 0;
const MAX_ROUND = 3;

let playerScore = 0;
let aiScore = 0;

function detectGesture(hand) {
  const index = hand[8].y < hand[6].y;
  const middle = hand[12].y < hand[10].y;
  const ring = hand[16].y < hand[14].y;
  const pinky = hand[20].y < hand[18].y;

  // BATU
  if (!index && !middle && !ring && !pinky) {
    return "Batu";
  }

  // GUNTING
  if (index && middle && !ring && !pinky) {
    return "Gunting";
  }

  // KERTAS
  if (index && middle && ring && pinky) {
    return "Kertas";
  }

  return "Tidak Terdeteksi";
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.75,
  minTrackingConfidence: 0.75,
  selfieMode: false,
});

hands.onResults((results) => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.save();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
      color: "#00ff00",
      lineWidth: 4,
    });

    drawLandmarks(ctx, landmarks, {
      color: "#ff0000",
      lineWidth: 2,
    });

    currentGesture = detectGesture(landmarks);
    console.log(currentGesture);

    gestureText.innerText = currentGesture;
  } else {
    currentGesture = "Tidak Terdeteksi";

    gestureText.innerText = "-";
  }
  console.log(results.multiHandLandmarks);

  ctx.restore();
});

const camera = new Camera(video, {
  onFrame: async () => {
    if (video.videoWidth === 0) return;
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});

camera.start();

function getImage(choice) {
  switch (choice) {
    case "Batu":
      return "assets/batu.png";
    case "Gunting":
      return "assets/gunting.png";
    case "Kertas":
      return "assets/kertas.png";
    default:
      return "";
  }
}

function getAIChoice() {
  const choices = ["Batu", "Gunting", "Kertas"];

  return choices[Math.floor(Math.random() * choices.length)];
}

function getWinner(player, ai) {
  if (player === ai) {
    return "SERI ";
  }

  if (
    (player === "Batu" && ai === "Gunting") ||
    (player === "Gunting" && ai === "Kertas") ||
    (player === "Kertas" && ai === "Batu")
  ) {
    playerScore++;

    playerScoreText.innerText = playerScore;

    return "KAMU MENANG";
  }

  aiScore++;

  aiScoreText.innerText = aiScore;

  return "AI MENANG ";
}

playBtn.addEventListener("click", () => {
  if (playBtn.dataset.finished === "true") {
    resetGame();
    return;
  }

  if (round >= MAX_ROUND) {
    return;
  }

  if (currentGesture === "Tidak Terdeteksi") {
    alert("Tangan belum terdeteksi!");
    return;
  }

  round++;

  const roundText = document.getElementById("roundText");
  roundText.innerText = ` ${round} / ${MAX_ROUND}`;

  const aiChoice = getAIChoice();

  aiHandImg.src = getImage(aiChoice);

  aiHandImg.style.display = "block";

  aiHandImg.classList.add("show");

  aiChoiceText.innerText = aiChoice;

  aiHandImg.src = getImage(aiChoice);

  const result = getWinner(currentGesture, aiChoice);

  resultText.innerText = result;

  gameMessage.innerText = result;

  setTimeout(() => {
    aiHandImg.classList.remove("show");

    setTimeout(() => {
      aiHandImg.style.display = "none";
    }, 200);
  }, 1000);

  if (result.includes("KAMU MENANG")) {
    winSound.play();
  } else if (result.includes("SERI")) {
    drawSound.play();
  } else {
    loseSound.play();
  }

  if (round === MAX_ROUND) {
    playBtn.disabled = true;

    if (round >= MAX_ROUND) {
      showFinalResult();
      return;
    }
  }
});

function showFinalResult() {
  let finalText = "";

  if (playerScore > aiScore) {
    finalText = "KAMU JUARA!";
  } else if (playerScore < aiScore) {
    finalText = "AI MENANG!";
  } else {
    finalText = "HASIL SERI!";
  }

  gameMessage.innerHTML = `
    ${finalText}<br>
    Kamu ${playerScore} - ${aiScore} AI
  `;

  playBtn.disabled = false;
  playBtn.innerText = "NEXT GAME";
  playBtn.dataset.finished = "true";
}

function resetGame() {
  round = 0;
  playerScore = 0;
  aiScore = 0;

  currentGesture = "Tidak Terdeteksi";

  playerScoreText.innerText = "0";
  aiScoreText.innerText = "0";

  gestureText.innerText = "-";
  aiChoiceText.innerText = "-";
  resultText.innerText = "Menunggu...";

  roundText.innerText = "1 / 3";

  gameMessage.innerHTML = "";

  aiHandImg.classList.remove("show");
  aiHandImg.style.display = "none";

  playBtn.innerText = "SUIT!";
  playBtn.dataset.finished = "false";
  playBtn.disabled = false;
}
