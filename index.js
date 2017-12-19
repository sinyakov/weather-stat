function drawGraph(canvasSize, ctx, data, startYear) {
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Считаем координаты точек
  const points = [];

  const dx = canvasSize.width * 0.95 / (data.length + 1);
  const maxValue = Math.max(...data); // ---> 0
  const minValue = Math.min(...data); // ---> canvasSize.height

  for (let i = 0; i < data.length; i++) {
    const x = dx * (i + 1) + canvasSize.width * 0.025;
    const y =
      canvasSize.height * 0.85 -
      (data[i] - minValue) / (maxValue - minValue) * canvasSize.height * 0.8;
    points.push({ x, y });
  }

  // Подписываем годы
  const yearStringWidth = 45;
  const yearCaptionWidth = canvasSize.width / (yearStringWidth * 3);
  const yearGap = Math.floor(data.length / yearCaptionWidth) || 1;

  for (let i = 0; i < data.length; i += yearGap) {
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.font = '16px Arial';
    ctx.beginPath();
    ctx.moveTo(points[i].x, canvasSize.height * 0.05);
    ctx.lineTo(points[i].x, canvasSize.height * 0.9);
    ctx.stroke();

    ctx.fillText(startYear + i, points[i].x - 18, canvasSize.height * 0.97);
  }

  // Соединяем точки линиями
  ctx.strokeStyle = '#000';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();

  // Отмечаем точки и подписываем значения через каждые captionGap лет
  const captionGap = Math.ceil(data.length / 40);

  for (let i = 0; i < data.length; i++) {
    ctx.fillStyle = '#00F';
    ctx.fillRect(points[i].x - 2, points[i].y - 2, 4, 4);
    if (i % captionGap === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = 'rgba(222, 222, 222, 0.4)';
      ctx.fillRect(points[i].x - 16, points[i].y - 30, 34, 24);
      ctx.fillStyle = '#00F';
      ctx.fillText(data[i], points[i].x - 8, points[i].y - 12);
    }
  }
}

function renderCanvas(header, canvas, data, startYear) {
  const scale = 2;
  const MAX_HEIGHT = 800;
  const BOTTOM_PADDING = 16;
  const canvasSize = {
    width: header.offsetWidth,
    height: Math.min(
      window.innerHeight - header.offsetHeight - BOTTOM_PADDING,
      MAX_HEIGHT
    )
  };
  const ctx = canvas.getContext('2d');

  canvas.width = canvasSize.width * scale;
  canvas.height = canvasSize.height * scale;
  canvas.style.width = `${canvasSize.width}px`;
  canvas.style.height = `${canvasSize.height}px`;
  ctx.scale(scale, scale);

  drawGraph(canvasSize, ctx, data, startYear);
}

const header = document.getElementById('header');
const canvas = document.getElementById('graph');
const startYear = 1937;
const data = Array.from({ length: ~~(Math.random() * 100) }).map(
  () => ~~(Math.random() * 50 - 25)
);

renderCanvas(header, canvas, data, startYear);
