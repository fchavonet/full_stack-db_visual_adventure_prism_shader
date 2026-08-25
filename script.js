const API_URL = "https://fchavonet.github.io/full_stack-db_visual_adventure_cards_api/api/v1/cards.json";

const partSelect = document.getElementById("partSelect");
const cardSelect = document.getElementById("cardSelect");
const glCanvas = document.getElementById("glCanvas");
const previewMessage = document.getElementById("previewMessage");
const stage = document.getElementById("stage");
const motionEnabled = document.getElementById("motionEnabled");

let prismCards = [];
let currentCardId = "";

let cardTextureReady = false;

let tiltX = 0;
let tiltY = 0;

let targetTiltX = 0;
let targetTiltY = 0;

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
    uniform vec2 u_tilt;

    varying vec2 v_uv;

    vec3 spectral(float phase) {
        float value = fract(phase);

        vec3 color;

        color.r = 0.52 + 0.48 * cos(
            6.2831853 * (
                value + 0.00
            )
        );

        color.g = 0.52 + 0.48 * cos(
            6.2831853 * (
                value + 0.34
            )
        );

        color.b = 0.52 + 0.48 * cos(
            6.2831853 * (
                value + 0.68
            )
        );

        color = max(
            color,
            vec3(0.0)
        );

        color = pow(
            color,
            vec3(1.35)
        );

        return color;
    }

    float hash21(vec2 position) {
        position = fract(
            position * vec2(
                123.34,
                456.21
            )
        );

        position += dot(
            position,
            position + 45.32
        );

        return fract(
            position.x * position.y
        );
    }

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

        vec2 cellId = floor(
            cellCoord
        );

        vec2 p = fract(
            cellCoord
        ) - 0.5;

        float ax = abs(
            p.x
        );

        float ay = abs(
            p.y
        );

        float facetSlope = 0.42;

        vec3 normal = vec3(
            0.0,
            0.0,
            1.0
        );

        float facetIndex = 0.0;

        if (ax >= ay) {
            if (p.x >= 0.0) {
                normal = normalize(
                    vec3(
                        facetSlope,
                        0.0,
                        1.0
                    )
                );

                facetIndex = 0.00;
            } else {
                normal = normalize(
                    vec3(
                        -facetSlope,
                        0.0,
                        1.0
                    )
                );

                facetIndex = 0.50;
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

                facetIndex = 0.25;
            } else {
                normal = normalize(
                    vec3(
                        0.0,
                        -facetSlope,
                        1.0
                    )
                );

                facetIndex = 0.75;
            }
        }

        vec3 viewDirection = normalize(
            vec3(
                -u_tilt.x * 0.72,
                u_tilt.y * 0.72,
                1.45
            )
        );

        vec3 lightDirection = normalize(
            vec3(
                -0.42 + u_tilt.x * 0.10,
                0.50 + u_tilt.y * 0.08,
                1.0
            )
        );

        vec3 halfDirection = normalize(
            viewDirection + lightDirection
        );

        float ndh = max(
            dot(
                normal,
                halfDirection
            ),
            0.0
        );

        float ndv = max(
            dot(
                normal,
                viewDirection
            ),
            0.0
        );

        float broadReflection = pow(
            ndh,
            4.2
        );

        float sharpReflection = pow(
            ndh,
            48.0
        );

        float grazingReflection = pow(
            1.0 - ndv,
            1.7
        );

        float diagonalDistance = abs(
            ax - ay
        );

        float diagonalLine = 1.0 - smoothstep(
            0.0,
            0.035,
            diagonalDistance
        );

        float foilEnergy = 0.0;

        foilEnergy += broadReflection * 0.42;
        foilEnergy += sharpReflection * 1.15;
        foilEnergy += grazingReflection * 0.06;
        foilEnergy += diagonalLine * sharpReflection * 0.20;

        foilEnergy = clamp(
            foilEnergy,
            0.0,
            1.0
        );

        float localRamp = p.x;

        if (ax >= ay) {
            localRamp = p.y;
        }

        float cellVariation = hash21(
            cellId
        );

        float spectralPhase = facetIndex;

        spectralPhase += localRamp * 0.42;

        spectralPhase += dot(
            halfDirection.xy,
            vec2(
                0.32,
                -0.28
            )
        );

        spectralPhase += (
            u_tilt.x - u_tilt.y
        ) * 0.14;

        spectralPhase += cellVariation * 0.08;

        vec3 prismColor = spectral(
            spectralPhase
        );

        vec3 silverColor = vec3(
            0.92,
            0.95,
            1.0
        );

        vec3 reflectedColor = silverColor * foilEnergy;

        reflectedColor += prismColor * foilEnergy * 0.28;

        vec3 result = 1.0 - (
            1.0 - baseColor.rgb
        ) * (
            1.0 - reflectedColor
        );

        float silverFlash = sharpReflection * 0.24;

        silverFlash += diagonalLine * sharpReflection * 0.12;

        result += vec3(
            silverFlash
        );

        result = clamp(
            result,
            0.0,
            1.0
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

const tiltLocation = gl.getUniformLocation(
  program,
  "u_tilt"
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

  populateCardSelect(
    partSelect.value
  );
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

    cardSelect.appendChild(
      option
    );
  });

  cardSelect.disabled = false;

  displaySelectedCard(
    cardSelect.value
  );
}

function displaySelectedCard(cardId) {
  const selectedCard = prismCards.find(function (card) {
    return card.id === cardId;
  });

  if (!selectedCard) {
    currentCardId = "";
    cardTextureReady = false;

    glCanvas.classList.add(
      "hidden"
    );

    previewMessage.classList.remove(
      "hidden"
    );

    previewMessage.textContent = "No card selected.";

    return;
  }

  currentCardId = selectedCard.id;
  cardTextureReady = false;

  glCanvas.classList.add(
    "hidden"
  );

  previewMessage.classList.remove(
    "hidden"
  );

  previewMessage.textContent = "Loading card...";

  const image = new Image();

  image.crossOrigin = "anonymous";

  image.addEventListener(
    "load",
    function () {
      if (currentCardId !== selectedCard.id) {
        return;
      }

      renderCard(
        image
      );

      previewMessage.classList.add(
        "hidden"
      );

      glCanvas.classList.remove(
        "hidden"
      );
    }
  );

  image.addEventListener(
    "error",
    function () {
      if (currentCardId !== selectedCard.id) {
        return;
      }

      cardTextureReady = false;

      previewMessage.classList.remove(
        "hidden"
      );

      previewMessage.textContent = "Unable to load card image.";
    }
  );

  image.src = selectedCard.front_image_url;
}

function renderCard(image) {
  glCanvas.width = image.naturalWidth;
  glCanvas.height = image.naturalHeight;

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

  cardTextureReady = true;

  renderScene();
}

function renderScene() {
  if (!cardTextureReady) {
    return;
  }

  gl.viewport(
    0,
    0,
    glCanvas.width,
    glCanvas.height
  );

  gl.useProgram(
    program
  );

  gl.uniform2f(
    resolutionLocation,
    glCanvas.width,
    glCanvas.height
  );

  gl.uniform2f(
    tiltLocation,
    tiltX,
    tiltY
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
  const shader = gl.createShader(
    type
  );

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(
    shader
  );

  const success = gl.getShaderParameter(
    shader,
    gl.COMPILE_STATUS
  );

  if (!success) {
    const message = gl.getShaderInfoLog(
      shader
    );

    gl.deleteShader(
      shader
    );

    throw new Error(
      message
    );
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

  gl.linkProgram(
    shaderProgram
  );

  const success = gl.getProgramParameter(
    shaderProgram,
    gl.LINK_STATUS
  );

  if (!success) {
    const message = gl.getProgramInfoLog(
      shaderProgram
    );

    gl.deleteProgram(
      shaderProgram
    );

    throw new Error(
      message
    );
  }

  return shaderProgram;
}

function updatePointer(event) {
  if (!motionEnabled.checked) {
    return;
  }

  const rect = stage.getBoundingClientRect();

  const pointerX = (
    event.clientX - rect.left
  ) / rect.width;

  const pointerY = (
    event.clientY - rect.top
  ) / rect.height;

  targetTiltX = (
    pointerX - 0.5
  ) * 2.0;

  targetTiltY = (
    pointerY - 0.5
  ) * 2.0;
}

function animate() {
  const smoothing = 0.08;

  tiltX += (
    targetTiltX - tiltX
  ) * smoothing;

  tiltY += (
    targetTiltY - tiltY
  ) * smoothing;

  renderScene();

  requestAnimationFrame(
    animate
  );
}

partSelect.addEventListener(
  "change",
  function () {
    populateCardSelect(
      partSelect.value
    );
  }
);

cardSelect.addEventListener(
  "change",
  function () {
    displaySelectedCard(
      cardSelect.value
    );
  }
);

stage.addEventListener(
  "pointermove",
  function (event) {
    updatePointer(
      event
    );
  }
);

stage.addEventListener(
  "pointerleave",
  function () {
    targetTiltX = 0;
    targetTiltY = 0;
  }
);

motionEnabled.addEventListener(
  "change",
  function () {
    if (motionEnabled.checked) {
      return;
    }

    targetTiltX = 0;
    targetTiltY = 0;
  }
);

fetchPrismCards();
animate();
