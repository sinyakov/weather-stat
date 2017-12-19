const TYPE_TEMPERATURE = 'temperature';
const TYPE_PRECIPITATION = 'precipitation';
const SELECT_START = 'start';
const SELECT_END = 'end';
const MIN_YEAR = 1881;
const MAX_YEAR = 2006;

function getUrlParams(search) {
  const hashes = search.slice(search.indexOf('?') + 1).split('&');
  const params = {};
  hashes.map(hash => {
    const [key, val] = hash.split('=');
    params[key] = decodeURIComponent(val);
  });

  return params;
}

function mapData(data) {
  const map = {};
  for (let i = 0; i < data.length; i++) {
    const [year] = data[i].t.split('-');
    if (!map[year]) {
      map[year] = [];
    }
    map[year].push(data[i].v);
  }
  return map;
}

function getAverages(mappedData) {
  const averages = {};
  Object.keys(mappedData).forEach(key => {
    averages[key] = (
      mappedData[key].reduce((acc, curr) => acc + curr) / mappedData[key].length
    ).toFixed(1);
  });
  return averages;
}

function createQuery(params) {
  const esc = encodeURIComponent;
  return Object.keys(params)
    .map(k => encodeURIComponent(k) + '=' + esc(params[k]))
    .join('&');
}

function throttle(func, ms) {
  let isThrottled = false;
  let savedArgs = null;
  let savedThis = null;

  function wrapper() {
    if (isThrottled) {
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    func.apply(this, arguments);

    isThrottled = true;

    setTimeout(function() {
      isThrottled = false;
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = null;
        savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

class Graph {
  constructor(canvas, header) {
    this.canvas = canvas;
    this.header = header;
  }

  drawGraph(canvasSize, ctx, data, startYear) {
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

  renderCanvas(data, startYear) {
    const scale = 2;
    const MAX_HEIGHT = 800;
    const BOTTOM_PADDING = 16;
    const canvasSize = {
      width: this.header.offsetWidth,
      height: Math.min(
        window.innerHeight - this.header.offsetHeight - BOTTOM_PADDING,
        MAX_HEIGHT
      )
    };
    const ctx = this.canvas.getContext('2d');

    this.canvas.width = canvasSize.width * scale;
    this.canvas.height = canvasSize.height * scale;
    this.canvas.style.width = `${canvasSize.width}px`;
    this.canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(scale, scale);

    this.drawGraph(canvasSize, ctx, data, startYear);
  }
}

class UI {
  constructor(
    getState,
    setState,
    buttonTemperature,
    buttonPrecipitation,
    selectStart,
    selectEnd
  ) {
    this.buttonTemperature = buttonTemperature;
    this.buttonPrecipitation = buttonPrecipitation;
    this.selectStart = selectStart;
    this.selectEnd = selectEnd;
    this.setState = setState;
    this.getState = getState;
  }

  switchType(type) {
    const state = this.getState();

    this.setState({
      ...state,
      options: {
        ...state.options,
        type
      }
    });
  }

  switchDate(dateType, value) {
    const state = this.getState();

    this.setState({
      ...state,
      options: {
        ...state.options,
        [dateType]: value
      }
    });
  }

  setDefault() {
    const { options } = this.getState();

    const start = MIN_YEAR;
    const end = MAX_YEAR;

    switch (options.type) {
      case TYPE_TEMPERATURE:
        this.buttonTemperature.parentNode.classList.add(
          'datatype__label--active'
        );
        break;
      case TYPE_PRECIPITATION:
        this.buttonPrecipitation.parentNode.classList.add(
          'datatype__label--active'
        );
        break;
    }

    for (let i = start; i <= end; i++) {
      const option = document.createElement('option', { value: i });
      option.selected = i === options.start;
      option.textContent = i;
      this.selectStart.appendChild(option);
    }

    for (let i = start; i <= end; i++) {
      const option = document.createElement('option', {
        value: i
      });
      option.selected = i === options.end;
      option.textContent = i;
      this.selectEnd.appendChild(option);
    }
  }

  bindActions() {
    this.buttonTemperature.addEventListener('click', () => {
      this.switchType(TYPE_TEMPERATURE);
      this.buttonTemperature.parentNode.classList.add(
        'datatype__label--active'
      );
      this.buttonPrecipitation.parentNode.classList.remove(
        'datatype__label--active'
      );
    });
    this.buttonPrecipitation.addEventListener('click', () => {
      this.switchType(TYPE_PRECIPITATION);
      this.buttonPrecipitation.parentNode.classList.add(
        'datatype__label--active'
      );
      this.buttonTemperature.parentNode.classList.remove(
        'datatype__label--active'
      );
    });
    this.selectStart.addEventListener('change', e => {
      this.switchDate(SELECT_START, parseInt(e.target.value, 10));
    });
    this.selectEnd.addEventListener('change', e => {
      this.switchDate(SELECT_END, parseInt(e.target.value, 10));
    });
  }

  init() {
    this.setDefault();
    this.bindActions();
  }
}

class App {
  constructor(header, canvas, error) {
    this.header = header;
    this.canvas = canvas;
    this.error = error;

    const { type, start, end } = getUrlParams(window.location.href);

    this.state = {
      options: {
        type: type || 'temperature',
        start: parseInt(start, 10) || MIN_YEAR,
        end: parseInt(end, 10) || MAX_YEAR
      },
      data: {
        temperature: null,
        precipitation: null
      }
    };
  }

  fetchData(dataName) {
    if (!this.state.data[dataName]) {
      return fetch(`./data/${dataName}.json`)
        .then(resp => resp.json())
        .then(mapData)
        .then(getAverages)
        .then(averages => {
          this.setState({
            data: {
              ...this.state.data,
              [dataName]: averages
            }
          });
          return averages;
        })
        .catch(() => this.renderError('Ошибка при загрузке данных'));
    }
    return Promise.resolve(this.state.data[dataName]);
  }

  filterData() {
    const filtered = [];
    const { options, data } = this.state;
    for (let year = options.start; year <= options.end; year++) {
      filtered.push(data[options.type][year]);
    }
    return filtered;
  }

  createInterface() {
    this.interface = new UI(
      this.getState.bind(this),
      this.setState.bind(this),
      document.getElementById(TYPE_TEMPERATURE),
      document.getElementById(TYPE_PRECIPITATION),
      document.getElementById(SELECT_START),
      document.getElementById(SELECT_END)
    );

    this.interface.init();
  }

  createGraph() {
    this.graph = new Graph(this.canvas, this.header);
  }

  getState() {
    return this.state;
  }

  setState(newValues) {
    this.state = {
      ...this.state,
      ...newValues
    };

    this.render();
  }

  updateUrl() {
    const newQuery = createQuery(this.state.options);
    const URL = `${window.location.origin}/?${newQuery}`;

    window.history.pushState(null, null, URL);
  }

  isValid() {
    const { options } = this.state;
    return (
      options.start < options.end &&
      options.start >= MIN_YEAR &&
      options.end <= MAX_YEAR
    );
  }

  renderError(err) {
    this.error.textContent = err;
    this.canvas.classList.add('invisible');
    this.error.classList.remove('invisible');

    return Promise.resolve();
  }

  render() {
    const { options } = this.state;

    if (this.isValid()) {
      this.canvas.classList.remove('invisible');
      this.error.classList.add('invisible');
      this.fetchData(options.type)
        .then(() => this.filterData())
        .then(filtered => this.graph.renderCanvas(filtered, options.start))
        .then(() => this.updateUrl());
    } else {
      this.renderError('Невалидные временные границы').then(() =>
        this.updateUrl()
      );
    }
  }

  init() {
    this.createInterface();
    this.render();
    this.createGraph();

    const resize = throttle(() => {
      const { options } = this.state;
      const filtered = this.filterData();

      this.graph.renderCanvas(filtered, options.start);
    }, 150);
    window.addEventListener('resize', resize);
  }
}

const app = new App(
  document.getElementById('header'),
  document.getElementById('graph'),
  document.getElementById('error')
);

app.init();
