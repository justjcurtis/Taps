let w;
let h;
function setup() {
  w = window.innerWidth;
  h = window.innerHeight - window.innerHeight * 0.1;
  createCanvas(w, h, P2D);
  createElement("button", "Download json").mousePressed(downloadJSON);
  createElement("button", "Export taps to CSV").mousePressed(exportTapsToCSV);
}

const min = 0;
const max = 100;
const step = 20;
let bg = min;
let touching = false;
const taps = [];
let tapStart;
let started = false;

const getHud = () => {
  const total = taps
    .map(({ tapStart, tapEnd }) => tapEnd - tapStart)
    .reduce((acc, curr) => acc + curr);

  const averageLength = Math.round((total / 1000 / taps.length) * 1000) / 1000;

  const between = taps.reduce((acc, curr, i) => {
    if (i === 0) return acc;
    const prev = taps[i - 1];
    acc.push(curr.tapStart - prev.tapEnd);
    return acc;
  }, []);

  const averageBetween =
    Math.round(
      (between.reduce((acc, curr) => acc + curr) / 1000 / between.length) * 1000
    ) / 1000;
  const betweenTotal = between.reduce((acc, curr) => acc + curr);

  return { total, averageLength, between, averageBetween, betweenTotal };
};

const exportTapsToCSV = () => {
  const csv = taps.reduce((acc, { tapStart, tapEnd }) => {
    return `${acc}${tapStart},${tapEnd}\n`;
  }, "");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "taps.csv";
  a.click();
  document.body.removeChild(a);
};

const downloadJSON = () => {
  const json = JSON.stringify({ taps, hud: getHud() });
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "taps.json";
  a.click();
  document.body.removeChild(a);
};

const handleBG = () => {
  background(0, bg, 0);
  if (touching) {
    bg += step;
    if (bg >= max) bg = max;
  } else {
    bg -= step;
    if (bg <= min) bg = min;
  }
};

const handleLine = () => {
  if (taps.length < 2) return;
  stroke(100, 0, 100);
  strokeWeight(2);
  noFill();
  beginShape();
  const slice = taps.slice(-10);
  const { minY, maxY } = slice.reduce(
    (acc, { tapStart, tapEnd }) => {
      if (tapEnd - tapStart < acc.minY) acc.minY = tapEnd - tapStart;
      if (tapEnd - tapStart > acc.maxY) acc.maxY = tapEnd - tapStart;
      return acc;
    },
    { minY: Infinity, maxY: -Infinity }
  );
  const { minX, maxX } = {
    minX: slice[0].tapStart,
    maxX: slice[slice.length - 1].tapStart,
  };
  slice.forEach(({ tapStart, tapEnd }) => {
    const x = map(tapStart, minX, maxX, 0, w);
    const y = map(tapEnd - tapStart, minY, maxY, h * 0.9, h * 0.9 - 100);
    vertex(x, y);
  });
  endShape();
};

const handleText = () => {
  if (taps.length < 2) return;
  textSize(20);
  fill(255);
  noStroke();
  const { total, averageLength, between, averageBetween, betweenTotal } =
    getHud();
  text("Taps: " + taps.length, 30, 30);
  text("Average on time: " + averageLength + "s", 30, 60);
  text("Average between time: " + averageBetween, 30, 90);

  text("Total on time: " + averageLength + "s", 30, 150);
  text("Total between time: " + betweenTotal / 1000 + "s", 30, 180);
  text("Total time: " + (total + betweenTotal) / 1000 + "s", 30, 210);
};

function draw() {
  handleBG();
  handleLine();
  if (!started && !touching) {
    textSize(32);
    fill(255);
    text("Touch to start", w / 2 - 100, h / 2);
  }
  handleText();
}

function touchStarted() {
  if (mouseY > h * 0.9) return;
  touching = true;
  tapStart = millis();
}

function touchEnded() {
  if (!touching) return;
  if (!started) {
    started = true;
    touching = false;
    return;
  }
  touching = false;
  taps.push({ tapStart, tapEnd: millis() });
  tapStart = null;
}
