const API_URL = "https://fchavonet.github.io/full_stack-db_visual_adventure_cards_api/api/v1/cards.json";

const partSelect = document.getElementById("partSelect");
const cardSelect = document.getElementById("cardSelect");
const glCanvas = document.getElementById("glCanvas");
const previewMessage = document.getElementById("previewMessage");

let prismCards = [];
let currentCardId = "";

const gl = glCanvas.getContext("webgl");

if (!gl) {
  throw new Error("WebGL is not supported by this browser.");
}

const vertexShaderSource = `
    attribute vec2 a_position;

    varying vec2 v_uv;

    void main() {
        v_uv = a_position * 0.5 + 0.5;

        gl_Position = vec4(
            a_position,
            0.0,
            1.0
        );
    }
`;

const fragmentShaderSource = `
    precision mediump float;

    uniform sampler2D u_texture;
    uniform vec2 u_resolution;

    varying vec2 v_uv;

    void main() {
        vec4 baseColor = texture2D(
            u_texture,
            v_uv
        );

        vec2 imagePx = vec2(
            v_uv.x * u_resolution.x,
            (1.0 - v_uv.y) * u_resolution.y
        );

        float cellSize = 150.0;

        vec2 gridOffset = vec2(
            96.0,
            104.0
        );

        vec2 cellCoord = (
            imagePx - gridOffset
        ) / cellSize;

        vec2 p = fract(cellCoord) - 0.5;

        float ax = abs(p.x);
        float ay = abs(p.y);

        float facetSlope = 0.42;

        vec3 normal = vec3(
            0.0,
            0.0,
            1.0
        );

        if (ax >= ay) {
            if (p.x >= 0.0) {
                normal = normalize(
                    vec3(
                        facetSlope,
                        0.0,
                        1.0
                    )
                );
            } else {
                normal = normalize(
                    vec3(
                        -facetSlope,
                        0.0,
                        1.0
                    )
                );
            }
        } else {
            if (p.y >= 0.0) {
                normal = normalize(
                    vec3(
                        0.0,
                        facetSlope,
                        1.0
                    )
                );
            } else {
                normal = normalize(
                    vec3(
                        0.0,
                        -facetSlope,
                        1.0
                    )
                );
            }
        }

        vec3 lightDirection = normalize(
            vec3(
                -0.35,
                0.45,
                1.0
            )
        );

        float light = max(
            dot(
                normal,
                lightDirection
            ),
            0.0
        );

        vec3 geometryColor = vec3(
            0.35 + light * 0.65
        );

        vec3 result = mix(
            baseColor.rgb,
            geometryColor,
            0.22
        );

        gl_FragColor = vec4(
            result,
            baseColor.a
        );
    }
`;

const vertexShader = createShader(
  gl.VERTEX_SHADER,
  vertexShaderSource
);

const fragmentShader = createShader(
  gl.FRAGMENT_SHADER,
  fragmentShaderSource
);

const program = createProgram(
  vertexShader,
  fragmentShader
);

const positionLocation = gl.getAttribLocation(
  program,
  "a_position"
);

const textureLocation = gl.getUniformLocation(
  program,
  "u_texture"
);

const resolutionLocation = gl.getUniformLocation(
  program,
  "u_resolution"
);

const positionBuffer = gl.createBuffer();

gl.bindBuffer(
  gl.ARRAY_BUFFER,
  positionBuffer
);

gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    1.0, 1.0
  ]),
  gl.STATIC_DRAW
);

const cardTexture = gl.createTexture();

gl.bindTexture(
  gl.TEXTURE_2D,
  cardTexture
);

gl.texParameteri(
  gl.TEXTURE_2D,
  gl.TEXTURE_WRAP_S,
  gl.CLAMP_TO_EDGE
);

gl.texParameteri(
  gl.TEXTURE_2D,
  gl.TEXTURE_WRAP_T,
  gl.CLAMP_TO_EDGE
);

gl.texParameteri(
  gl.TEXTURE_2D,
  gl.TEXTURE_MIN_FILTER,
  gl.LINEAR
);

gl.texParameteri(
  gl.TEXTURE_2D,
  gl.TEXTURE_MAG_FILTER,
  gl.LINEAR
);

async function fetchPrismCards() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const cards = await response.json();

    prismCards = cards.filter(function (card) {
      return card.rarity === "prism";
    });

    populatePartSelect();
  } catch (error) {
    console.error("Unable to load cards:", error);

    previewMessage.textContent = "Unable to load cards.";
  }
}

function populatePartSelect() {
  const parts = [];

  prismCards.forEach(function (card) {
    if (!parts.includes(card.part)) {
      parts.push(card.part);
    }
  });

  parts.sort(function (a, b) {
    return Number(a) - Number(b);
  });

  partSelect.innerHTML = "";

  parts.forEach(function (part) {
    const option = document.createElement("option");

    option.value = part;
    option.textContent = `Part ${part}`;

    partSelect.appendChild(option);
  });

  partSelect.disabled = false;

  populateCardSelect(partSelect.value);
}

function populateCardSelect(part) {
  const cardsForPart = prismCards.filter(function (card) {
    return String(card.part) === String(part);
  });

  cardSelect.innerHTML = "";

  cardsForPart.forEach(function (card) {
    const option = document.createElement("option");

    option.value = card.id;
    option.textContent = `#${card.number} — ${card.title_jp}`;

    cardSelect.appendChild(option);
  });

  cardSelect.disabled = false;

  displaySelectedCard(cardSelect.value);
}

function displaySelectedCard(cardId) {
  const selectedCard = prismCards.find(function (card) {
    return card.id === cardId;
  });

  if (!selectedCard) {
    glCanvas.classList.add("hidden");

    previewMessage.classList.remove("hidden");
    previewMessage.textContent = "No card selected.";

    return;
  }

  currentCardId = selectedCard.id;

  glCanvas.classList.add("hidden");

  previewMessage.classList.remove("hidden");
  previewMessage.textContent = "Loading card...";

  const image = new Image();

  image.crossOrigin = "anonymous";

  image.addEventListener("load", function () {
    if (currentCardId !== selectedCard.id) {
      return;
    }

    renderCard(image);

    previewMessage.classList.add("hidden");
    glCanvas.classList.remove("hidden");
  });

  image.addEventListener("error", function () {
    previewMessage.textContent = "Unable to load card image.";
  });

  image.src = selectedCard.front_image_url;
}

function renderCard(image) {
  glCanvas.width = image.naturalWidth;
  glCanvas.height = image.naturalHeight;

  gl.viewport(
    0,
    0,
    glCanvas.width,
    glCanvas.height
  );

  gl.useProgram(program);

  gl.uniform2f(
    resolutionLocation,
    glCanvas.width,
    glCanvas.height
  );

  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    positionBuffer
  );

  gl.enableVertexAttribArray(
    positionLocation
  );

  gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.activeTexture(
    gl.TEXTURE0
  );

  gl.bindTexture(
    gl.TEXTURE_2D,
    cardTexture
  );

  gl.pixelStorei(
    gl.UNPACK_FLIP_Y_WEBGL,
    true
  );

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.uniform1i(
    textureLocation,
    0
  );

  gl.drawArrays(
    gl.TRIANGLE_STRIP,
    0,
    4
  );
}

function createShader(type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(shader);

  const success = gl.getShaderParameter(
    shader,
    gl.COMPILE_STATUS
  );

  if (!success) {
    const message = gl.getShaderInfoLog(shader);

    gl.deleteShader(shader);

    throw new Error(message);
  }

  return shader;
}

function createProgram(vertexShader, fragmentShader) {
  const shaderProgram = gl.createProgram();

  gl.attachShader(
    shaderProgram,
    vertexShader
  );

  gl.attachShader(
    shaderProgram,
    fragmentShader
  );

  gl.linkProgram(shaderProgram);

  const success = gl.getProgramParameter(
    shaderProgram,
    gl.LINK_STATUS
  );

  if (!success) {
    const message = gl.getProgramInfoLog(shaderProgram);

    gl.deleteProgram(shaderProgram);

    throw new Error(message);
  }

  return shaderProgram;
}

partSelect.addEventListener("change", function () {
  populateCardSelect(partSelect.value);
});

cardSelect.addEventListener("change", function () {
  displaySelectedCard(cardSelect.value);
});

fetchPrismCards();
