const API_URL = "https://fchavonet.github.io/full_stack-db_visual_adventure_cards_api/api/v1/cards.json";

const LOCAL_PRESET_KEY = "db-visual-adventure-prism-preset";

const partSelect = document.getElementById("partSelect");
const cardSelect = document.getElementById("cardSelect");

const glCanvas = document.getElementById("glCanvas");
const cardShell = document.getElementById("cardShell");
const previewMessage = document.getElementById("previewMessage");
const stage = document.getElementById("stage");

const cardImageInput = document.getElementById("cardImageInput");
const cardImageFileName = document.getElementById("cardImageFileName");
const clearCardImageButton = document.getElementById("clearCardImageButton");
const cardImageThumb = document.getElementById("cardImageThumb");
const cardImageEmpty = document.getElementById("cardImageEmpty");

const maskInput = document.getElementById("maskInput");
const maskFileName = document.getElementById("maskFileName");
const clearMaskButton = document.getElementById("clearMaskButton");
const maskThumb = document.getElementById("maskThumb");
const maskEmpty = document.getElementById("maskEmpty");

const exportPresetButton = document.getElementById("exportPresetButton");
const presetInput = document.getElementById("presetInput");
const saveLocalButton = document.getElementById("saveLocalButton");
const loadLocalButton = document.getElementById("loadLocalButton");
const resetSettingsButton = document.getElementById("resetSettingsButton");

const cellSize = document.getElementById("cellSize");
const gridOffsetX = document.getElementById("gridOffsetX");
const gridOffsetY = document.getElementById("gridOffsetY");
const facetSlope = document.getElementById("facetSlope");

const intensity = document.getElementById("intensity");
const saturation = document.getElementById("saturation");
const gloss = document.getElementById("gloss");
const silverFlash = document.getElementById("silverFlash");
const broadReflection = document.getElementById("broadReflection");

const motionAmplitude = document.getElementById("motionAmplitude");
const smoothing = document.getElementById("smoothing");
const motionEnabled = document.getElementById("motionEnabled");
const motionPermissionButton = document.getElementById("motionPermissionButton");

const showMask = document.getElementById("showMask");
const showGrid = document.getElementById("showGrid");
const prismOnly = document.getElementById("prismOnly");

const tiltXValue = document.getElementById("tiltXValue");
const tiltYValue = document.getElementById("tiltYValue");

const desktopPointerQuery = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
);

const DEFAULT_SETTINGS = {
  cellSize: 150,
  gridOffsetX: 190,
  gridOffsetY: 180,
  facetSlope: 0.50,
  intensity: 0.95,
  saturation: 0.60,
  gloss: 35,
  silverFlash: 0.35,
  broadReflection: 0.35,
  motionAmplitude: 1,
  smoothing: 0.075,
  motionEnabled: true,
  showMask: false,
  showGrid: false,
  prismOnly: false
};

const rangeControls = [
  {
    key: "cellSize",
    input: cellSize,
    output: document.getElementById("cellSizeValue"),
    decimals: 0,
    suffix: " px"
  },
  {
    key: "gridOffsetX",
    input: gridOffsetX,
    output: document.getElementById("gridOffsetXValue"),
    decimals: 0,
    suffix: " px"
  },
  {
    key: "gridOffsetY",
    input: gridOffsetY,
    output: document.getElementById("gridOffsetYValue"),
    decimals: 0,
    suffix: " px"
  },
  {
    key: "facetSlope",
    input: facetSlope,
    output: document.getElementById("facetSlopeValue"),
    decimals: 2,
    suffix: ""
  },
  {
    key: "intensity",
    input: intensity,
    output: document.getElementById("intensityValue"),
    decimals: 2,
    suffix: ""
  },
  {
    key: "saturation",
    input: saturation,
    output: document.getElementById("saturationValue"),
    decimals: 2,
    suffix: ""
  },
  {
    key: "gloss",
    input: gloss,
    output: document.getElementById("glossValue"),
    decimals: 0,
    suffix: ""
  },
  {
    key: "silverFlash",
    input: silverFlash,
    output: document.getElementById("silverFlashValue"),
    decimals: 2,
    suffix: ""
  },
  {
    key: "broadReflection",
    input: broadReflection,
    output: document.getElementById("broadReflectionValue"),
    decimals: 2,
    suffix: ""
  },
  {
    key: "motionAmplitude",
    input: motionAmplitude,
    output: document.getElementById("motionAmplitudeValue"),
    decimals: 2,
    suffix: ""
  },
  {
    key: "smoothing",
    input: smoothing,
    output: document.getElementById("smoothingValue"),
    decimals: 3,
    suffix: ""
  }
];

let prismCards = [];
let currentCardId = "";

let cardTextureReady = false;
let maskLoaded = false;

let tiltX = 0;
let tiltY = 0;

let targetTiltX = 0;
let targetTiltY = 0;

let deviceMotionActive = false;

let motionBaseBeta = null;
let motionBaseGamma = null;

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
    precision highp float;

    uniform sampler2D u_texture;
    uniform sampler2D u_maskTexture;

    uniform vec2 u_resolution;
    uniform vec2 u_tilt;

    uniform float u_cellSize;
    uniform float u_gridOffsetX;
    uniform float u_gridOffsetY;
    uniform float u_facetSlope;

    uniform float u_intensity;
    uniform float u_saturation;
    uniform float u_gloss;
    uniform float u_silverFlash;
    uniform float u_broadReflection;

    uniform float u_useMask;

    uniform float u_showMask;
    uniform float u_showGrid;
    uniform float u_prismOnly;

    varying vec2 v_uv;

    float luminance(vec3 color) {
        return dot(
            color,
            vec3(
                0.2126,
                0.7152,
                0.0722
            )
        );
    }

    float saturationOf(vec3 color) {
        float highValue = max(
            color.r,
            max(
                color.g,
                color.b
            )
        );

        float lowValue = min(
            color.r,
            min(
                color.g,
                color.b
            )
        );

        float value = 0.0;

        if (highValue > 0.0001) {
            value = (
                highValue - lowValue
            ) / highValue;
        }

        return value;
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

    vec3 spectral(float phase) {
        float value = fract(
            phase
        );

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

    void main() {
        vec2 uv = v_uv;

        vec4 texel = texture2D(
            u_texture,
            uv
        );

        if (texel.a < 0.01) {
            discard;
        }

        vec3 base = texel.rgb;

        float baseLuminance = luminance(
            base
        );

        float baseSaturation = saturationOf(
            base
        );

        float foilVisibility = smoothstep(
            0.035,
            0.66,
            baseLuminance
        );

        float coloredInk = smoothstep(
            0.18,
            0.92,
            baseSaturation
        );

        float inkProtection = 1.0 - (
            0.72 *
            coloredInk *
            0.38
        );

        foilVisibility *= inkProtection;

        vec3 neutralSilver = vec3(
            baseLuminance * 0.97,
            baseLuminance * 0.985,
            baseLuminance
        );

        float neutralMask = smoothstep(
            0.34,
            0.88,
            baseLuminance
        );

        neutralMask *= (
            1.0 -
            coloredInk *
            0.58
        );

        base = mix(
            base,
            neutralSilver,
            0.18 * neutralMask
        );

        float maskValue = 1.0;

        if (u_useMask > 0.5) {
            vec4 maskTexel = texture2D(
                u_maskTexture,
                uv
            );

            maskValue = luminance(
                maskTexel.rgb
            );

            foilVisibility *= maskValue;
        }

        if (u_showMask > 0.5) {
            gl_FragColor = vec4(
                vec3(maskValue),
                1.0
            );

            return;
        }

        vec2 imagePx = vec2(
            uv.x * u_resolution.x,
            (1.0 - uv.y) * u_resolution.y
        );

        vec2 gridOffset = vec2(
            u_gridOffsetX,
            u_gridOffsetY
        );

        vec2 cellCoord = (
            imagePx - gridOffset
        ) / u_cellSize;

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
                        u_facetSlope,
                        0.0,
                        1.0
                    )
                );

                facetIndex = 0.00;
            } else {
                normal = normalize(
                    vec3(
                        -u_facetSlope,
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
                        u_facetSlope,
                        1.0
                    )
                );

                facetIndex = 0.25;
            } else {
                normal = normalize(
                    vec3(
                        0.0,
                        -u_facetSlope,
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
            viewDirection +
            lightDirection
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

        float sharp = pow(
            ndh,
            u_gloss
        );

        float broad = pow(
            ndh,
            4.2
        );

        float grazing = pow(
            1.0 - ndv,
            1.7
        );

        float localRamp = p.x;

        if (ax >= ay) {
            localRamp = p.y;
        }

        float cellJitter = hash21(
            cellId
        ) - 0.5;

        float diffractionPhase = facetIndex;

        diffractionPhase += dot(
            halfDirection.xy,
            vec2(
                1.85,
                -1.42
            )
        ) * 0.73;

        diffractionPhase += (
            localRamp *
            0.19
        );

        diffractionPhase += (
            cellJitter *
            0.025
        );

        diffractionPhase += (
            u_tilt.x *
            0.11
        );

        diffractionPhase -= (
            u_tilt.y *
            0.07
        );

        vec3 rainbow = spectral(
            diffractionPhase
        );

        vec3 prismColor = mix(
            vec3(1.0),
            rainbow,
            u_saturation * 0.74
        );

        float diagonalDistance = abs(
            ax - ay
        );

        float diagonalLine = 1.0 - smoothstep(
            0.0,
            0.018,
            diagonalDistance
        );

        float edgeX = min(
            fract(cellCoord.x),
            1.0 - fract(cellCoord.x)
        );

        float edgeY = min(
            fract(cellCoord.y),
            1.0 - fract(cellCoord.y)
        );

        float edgeDistance = min(
            edgeX,
            edgeY
        );

        float cellBorder = 1.0 - smoothstep(
            0.0,
            0.018,
            edgeDistance
        );

        float foilEnergy = (
            broad *
            u_broadReflection
        );

        foilEnergy += (
            sharp *
            1.18
        );

        foilEnergy += (
            grazing *
            0.08
        );

        foilEnergy += (
            diagonalLine *
            sharp *
            0.20
        );

        float micro = sin(
            (
                imagePx.x +
                imagePx.y
            ) * 0.42
        );

        micro *= sin(
            (
                imagePx.x -
                imagePx.y
            ) * 0.37
        );

        micro = (
            micro *
            0.5
        ) + 0.5;

        foilEnergy *= (
            0.94 +
            micro *
            0.06
        );

        foilEnergy *= u_intensity;

        vec3 result = base;

        float shade = (
            0.90 +
            broad *
            0.15
        );

        result *= mix(
            1.0,
            shade,
            foilVisibility * 0.55
        );

        vec3 reflected = (
            prismColor *
            foilEnergy
        );

        reflected *= (
            0.60 +
            baseLuminance *
            0.55
        );

        result = 1.0 - (
            1.0 - result
        ) * (
            1.0 - (
                reflected *
                foilVisibility
            )
        );

        float silverKick = (
            sharp *
            u_intensity *
            foilVisibility *
            u_silverFlash
        );

        result += vec3(
            silverKick
        );

        if (u_prismOnly > 0.5) {
            vec3 materialBase = vec3(
                0.24,
                0.25,
                0.27
            );

            vec3 materialReflection = (
                prismColor *
                foilEnergy
            );

            result = materialBase * (
                0.74 +
                broad *
                0.34
            );

            result = 1.0 - (
                1.0 - result
            ) * (
                1.0 - (
                    materialReflection *
                    maskValue
                )
            );

            result += vec3(
                sharp *
                u_silverFlash *
                0.82
            );
        }

        if (u_showGrid > 0.5) {
            float gridLine = max(
                cellBorder,
                diagonalLine * 0.45
            );

            result = mix(
                result,
                vec3(
                    0.02,
                    0.52,
                    0.82
                ),
                gridLine * 0.68
            );
        }

        result = max(
            result,
            vec3(0.0)
        );

        result = pow(
            result,
            vec3(0.96)
        );

        gl_FragColor = vec4(
            result,
            texel.a
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

const maskTextureLocation = gl.getUniformLocation(
  program,
  "u_maskTexture"
);

const resolutionLocation = gl.getUniformLocation(
  program,
  "u_resolution"
);

const tiltLocation = gl.getUniformLocation(
  program,
  "u_tilt"
);

const cellSizeLocation = gl.getUniformLocation(
  program,
  "u_cellSize"
);

const gridOffsetXLocation = gl.getUniformLocation(
  program,
  "u_gridOffsetX"
);

const gridOffsetYLocation = gl.getUniformLocation(
  program,
  "u_gridOffsetY"
);

const facetSlopeLocation = gl.getUniformLocation(
  program,
  "u_facetSlope"
);

const intensityLocation = gl.getUniformLocation(
  program,
  "u_intensity"
);

const saturationLocation = gl.getUniformLocation(
  program,
  "u_saturation"
);

const glossLocation = gl.getUniformLocation(
  program,
  "u_gloss"
);

const silverFlashLocation = gl.getUniformLocation(
  program,
  "u_silverFlash"
);

const broadReflectionLocation = gl.getUniformLocation(
  program,
  "u_broadReflection"
);

const useMaskLocation = gl.getUniformLocation(
  program,
  "u_useMask"
);

const showMaskLocation = gl.getUniformLocation(
  program,
  "u_showMask"
);

const showGridLocation = gl.getUniformLocation(
  program,
  "u_showGrid"
);

const prismOnlyLocation = gl.getUniformLocation(
  program,
  "u_prismOnly"
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
const maskTexture = gl.createTexture();

configureTexture(
  cardTexture
);

configureTexture(
  maskTexture
);

resetMaskTexture();
configureRangeControls();

async function fetchPrismCards() {
  try {
    const response = await fetch(
      API_URL
    );

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }

    const cards = await response.json();

    prismCards = cards.filter(function (card) {
      return card.rarity === "prism";
    });

    populatePartSelect();
  } catch (error) {
    console.error(
      "Unable to load cards:",
      error
    );

    previewMessage.textContent = "Unable to load cards.";
  }
}

function populatePartSelect() {
  const parts = [];

  prismCards.forEach(function (card) {
    if (!parts.includes(card.part)) {
      parts.push(
        card.part
      );
    }
  });

  parts.sort(function (a, b) {
    return Number(a) - Number(b);
  });

  partSelect.innerHTML = "";

  parts.forEach(function (part) {
    const option = document.createElement(
      "option"
    );

    option.value = part;
    option.textContent = `Part ${part}`;

    partSelect.appendChild(
      option
    );
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
    const option = document.createElement(
      "option"
    );

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

    resetCardImageControls();
    clearMask();

    cardShell.classList.add(
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

  resetCardImageControls();
  clearMask();

  cardShell.classList.add(
    "hidden"
  );

  previewMessage.classList.remove(
    "hidden"
  );

  previewMessage.textContent = "Loading card...";

  loadCardFromUrl(
    selectedCard.front_image_url,
    selectedCard
  );

  if (selectedCard.prism_mask_url) {
    loadMaskFromUrl(
      selectedCard.prism_mask_url,
      selectedCard.id
    );
  }
}

function loadCardFromUrl(imageUrl, selectedCard) {
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

      updateCardImagePreview(
        imageUrl
      );

      cardImageFileName.textContent = "API image";

      previewMessage.classList.add(
        "hidden"
      );

      cardShell.classList.remove(
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

      cardShell.classList.add(
        "hidden"
      );

      previewMessage.classList.remove(
        "hidden"
      );

      previewMessage.textContent = "Unable to load card image.";
    }
  );

  image.src = imageUrl;
}

function loadCardImage(file) {
  const image = new Image();

  const objectUrl = URL.createObjectURL(
    file
  );

  image.addEventListener(
    "load",
    function () {
      renderCard(
        image
      );

      cardImageFileName.textContent = file.name;
      clearCardImageButton.disabled = false;

      updateCardImagePreview(
        objectUrl
      );

      previewMessage.classList.add(
        "hidden"
      );

      cardShell.classList.remove(
        "hidden"
      );

      URL.revokeObjectURL(
        objectUrl
      );
    }
  );

  image.addEventListener(
    "error",
    function () {
      console.error(
        "Unable to load card image."
      );

      URL.revokeObjectURL(
        objectUrl
      );
    }
  );

  image.src = objectUrl;
}

function updateCardImagePreview(imageUrl) {
  cardImageThumb.src = imageUrl;

  cardImageEmpty.classList.add(
    "hidden"
  );

  cardImageThumb.classList.remove(
    "hidden"
  );
}

function resetCardImageControls() {
  cardImageInput.value = "";
  cardImageFileName.textContent = "No image loaded";

  cardImageThumb.removeAttribute(
    "src"
  );

  cardImageThumb.classList.add(
    "hidden"
  );

  cardImageEmpty.classList.remove(
    "hidden"
  );

  clearCardImageButton.disabled = true;
}

function clearCardImage() {
  resetCardImageControls();

  const selectedCard = prismCards.find(function (card) {
    return card.id === currentCardId;
  });

  if (!selectedCard) {
    return;
  }

  cardTextureReady = false;

  loadCardFromUrl(
    selectedCard.front_image_url,
    selectedCard
  );
}

function configureTexture(texture) {
  gl.bindTexture(
    gl.TEXTURE_2D,
    texture
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

function loadMask(file) {
  const image = new Image();

  const objectUrl = URL.createObjectURL(
    file
  );

  image.addEventListener(
    "load",
    function () {
      renderMask(
        image
      );

      maskFileName.textContent = file.name;
      clearMaskButton.disabled = false;

      updateMaskPreview(
        objectUrl
      );

      URL.revokeObjectURL(
        objectUrl
      );
    }
  );

  image.addEventListener(
    "error",
    function () {
      console.error(
        "Unable to load Prism mask."
      );

      URL.revokeObjectURL(
        objectUrl
      );
    }
  );

  image.src = objectUrl;
}

function loadMaskFromUrl(maskUrl, cardId) {
  const image = new Image();

  image.crossOrigin = "anonymous";

  image.addEventListener(
    "load",
    function () {
      if (currentCardId !== cardId) {
        return;
      }

      renderMask(
        image
      );

      maskFileName.textContent = "API mask";
      clearMaskButton.disabled = false;

      updateMaskPreview(
        maskUrl
      );
    }
  );

  image.addEventListener(
    "error",
    function () {
      if (currentCardId !== cardId) {
        return;
      }

      console.error(
        "Unable to load API Prism mask."
      );
    }
  );

  image.src = maskUrl;
}

function renderMask(image) {
  gl.bindTexture(
    gl.TEXTURE_2D,
    maskTexture
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

  maskLoaded = true;

  renderScene();
}

function updateMaskPreview(imageUrl) {
  maskThumb.src = imageUrl;

  maskEmpty.classList.add(
    "hidden"
  );

  maskThumb.classList.remove(
    "hidden"
  );
}

function resetMaskTexture() {
  gl.bindTexture(
    gl.TEXTURE_2D,
    maskTexture
  );

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      255,
      255,
      255,
      255
    ])
  );
}

function clearMask() {
  resetMaskTexture();

  maskLoaded = false;

  maskInput.value = "";
  maskFileName.textContent = "No mask loaded";

  maskThumb.removeAttribute(
    "src"
  );

  maskThumb.classList.add(
    "hidden"
  );

  maskEmpty.classList.remove(
    "hidden"
  );

  clearMaskButton.disabled = true;
}

function configureRangeControls() {
  rangeControls.forEach(function (control) {
    updateRangeOutput(
      control
    );

    control.input.addEventListener(
      "input",
      function () {
        updateRangeOutput(
          control
        );
      }
    );
  });
}

function updateRangeOutput(control) {
  const value = Number(
    control.input.value
  );

  control.output.textContent = (
    value.toFixed(
      control.decimals
    ) +
    control.suffix
  );
}

function updateAllRangeOutputs() {
  rangeControls.forEach(function (control) {
    updateRangeOutput(
      control
    );
  });
}

function updateTiltOutputs() {
  tiltXValue.textContent = tiltX.toFixed(
    3
  );

  tiltYValue.textContent = tiltY.toFixed(
    3
  );
}

function updateCardOrientation() {
  if (!desktopPointerQuery.matches) {
    cardShell.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg)";

    return;
  }

  const rotationX = -tiltY * 5;
  const rotationY = tiltX * 5;

  cardShell.style.transform =
    "perspective(1000px) " +
    `rotateX(${rotationX}deg) ` +
    `rotateY(${rotationY}deg)`;

  cardShell.style.transformOrigin = "center";
  cardShell.style.transformStyle = "preserve-3d";
  cardShell.style.willChange = "transform";
}

function createPreset() {
  return {
    version: 1,
    cardId: currentCardId,
    settings: {
      cellSize: Number(cellSize.value),
      gridOffsetX: Number(gridOffsetX.value),
      gridOffsetY: Number(gridOffsetY.value),
      facetSlope: Number(facetSlope.value),

      intensity: Number(intensity.value),
      saturation: Number(saturation.value),
      gloss: Number(gloss.value),
      silverFlash: Number(silverFlash.value),
      broadReflection: Number(broadReflection.value),

      motionAmplitude: Number(motionAmplitude.value),
      smoothing: Number(smoothing.value),

      motionEnabled: motionEnabled.checked,

      showMask: showMask.checked,
      showGrid: showGrid.checked,
      prismOnly: prismOnly.checked
    }
  };
}

function applyPreset(preset) {
  if (!preset) {
    return;
  }

  if (!preset.settings) {
    return;
  }

  rangeControls.forEach(function (control) {
    const value = preset.settings[
      control.key
    ];

    if (typeof value !== "number") {
      return;
    }

    control.input.value = value;
  });

  if (typeof preset.settings.motionEnabled === "boolean") {
    motionEnabled.checked = preset.settings.motionEnabled;
  }

  if (typeof preset.settings.showMask === "boolean") {
    showMask.checked = preset.settings.showMask;
  }

  if (typeof preset.settings.showGrid === "boolean") {
    showGrid.checked = preset.settings.showGrid;
  }

  if (typeof preset.settings.prismOnly === "boolean") {
    prismOnly.checked = preset.settings.prismOnly;
  }

  targetTiltX = 0;
  targetTiltY = 0;

  resetMotionCalibration();

  updateAllRangeOutputs();

  if (
    typeof preset.cardId === "string" &&
    preset.cardId !== ""
  ) {
    selectCardById(
      preset.cardId
    );
  }
}

function selectCardById(cardId) {
  const card = prismCards.find(function (item) {
    return item.id === cardId;
  });

  if (!card) {
    return;
  }

  partSelect.value = String(
    card.part
  );

  populateCardSelect(
    card.part
  );

  cardSelect.value = card.id;

  displaySelectedCard(
    card.id
  );
}

function exportPreset() {
  const preset = createPreset();

  const json = JSON.stringify(
    preset,
    null,
    2
  );

  const blob = new Blob(
    [
      json
    ],
    {
      type: "application/json"
    }
  );

  const objectUrl = URL.createObjectURL(
    blob
  );

  const link = document.createElement(
    "a"
  );

  let fileName = "prism-preset.json";

  if (currentCardId !== "") {
    fileName = `${currentCardId}-prism-preset.json`;
  }

  link.href = objectUrl;
  link.download = fileName;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  URL.revokeObjectURL(
    objectUrl
  );
}

async function importPreset(file) {
  try {
    const content = await file.text();

    const preset = JSON.parse(
      content
    );

    applyPreset(
      preset
    );
  } catch (error) {
    console.error(
      "Unable to import preset:",
      error
    );
  }

  presetInput.value = "";
}

function saveLocalPreset() {
  try {
    const preset = createPreset();

    localStorage.setItem(
      LOCAL_PRESET_KEY,
      JSON.stringify(
        preset
      )
    );
  } catch (error) {
    console.error(
      "Unable to save preset:",
      error
    );
  }
}

function loadLocalPreset() {
  try {
    const content = localStorage.getItem(
      LOCAL_PRESET_KEY
    );

    if (!content) {
      return;
    }

    const preset = JSON.parse(
      content
    );

    applyPreset(
      preset
    );
  } catch (error) {
    console.error(
      "Unable to load preset:",
      error
    );
  }
}

function restoreDefaults() {
  rangeControls.forEach(function (control) {
    control.input.value = DEFAULT_SETTINGS[
      control.key
    ];
  });

  motionEnabled.checked = DEFAULT_SETTINGS.motionEnabled;

  showMask.checked = DEFAULT_SETTINGS.showMask;
  showGrid.checked = DEFAULT_SETTINGS.showGrid;
  prismOnly.checked = DEFAULT_SETTINGS.prismOnly;

  targetTiltX = 0;
  targetTiltY = 0;

  resetMotionCalibration();

  updateAllRangeOutputs();
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

  gl.uniform1f(
    cellSizeLocation,
    Number(cellSize.value)
  );

  gl.uniform1f(
    gridOffsetXLocation,
    Number(gridOffsetX.value)
  );

  gl.uniform1f(
    gridOffsetYLocation,
    Number(gridOffsetY.value)
  );

  gl.uniform1f(
    facetSlopeLocation,
    Number(facetSlope.value)
  );

  gl.uniform1f(
    intensityLocation,
    Number(intensity.value)
  );

  gl.uniform1f(
    saturationLocation,
    Number(saturation.value)
  );

  gl.uniform1f(
    glossLocation,
    Number(gloss.value)
  );

  gl.uniform1f(
    silverFlashLocation,
    Number(silverFlash.value)
  );

  gl.uniform1f(
    broadReflectionLocation,
    Number(broadReflection.value)
  );

  let useMask = 0;

  if (maskLoaded) {
    useMask = 1;
  }

  gl.uniform1f(
    useMaskLocation,
    useMask
  );

  let showMaskValue = 0;

  if (showMask.checked) {
    showMaskValue = 1;
  }

  gl.uniform1f(
    showMaskLocation,
    showMaskValue
  );

  let showGridValue = 0;

  if (showGrid.checked) {
    showGridValue = 1;
  }

  gl.uniform1f(
    showGridLocation,
    showGridValue
  );

  let prismOnlyValue = 0;

  if (prismOnly.checked) {
    prismOnlyValue = 1;
  }

  gl.uniform1f(
    prismOnlyLocation,
    prismOnlyValue
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

  gl.activeTexture(
    gl.TEXTURE1
  );

  gl.bindTexture(
    gl.TEXTURE_2D,
    maskTexture
  );

  gl.uniform1i(
    maskTextureLocation,
    1
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

function clamp(value, minimum, maximum) {
  return Math.min(
    Math.max(
      value,
      minimum
    ),
    maximum
  );
}

function normalizeAngle(angle) {
  let normalizedAngle = angle;

  while (normalizedAngle > 180) {
    normalizedAngle -= 360;
  }

  while (normalizedAngle < -180) {
    normalizedAngle += 360;
  }

  return normalizedAngle;
}

function getScreenOrientationAngle() {
  if (
    screen.orientation &&
    typeof screen.orientation.angle === "number"
  ) {
    return screen.orientation.angle;
  }

  if (typeof window.orientation === "number") {
    return window.orientation;
  }

  return 0;
}

function resetMotionCalibration() {
  motionBaseBeta = null;
  motionBaseGamma = null;
}

function updateDeviceOrientation(event) {
  if (!motionEnabled.checked) {
    return;
  }

  if (
    typeof event.beta !== "number" ||
    typeof event.gamma !== "number"
  ) {
    return;
  }

  if (
    motionBaseBeta === null ||
    motionBaseGamma === null
  ) {
    motionBaseBeta = event.beta;
    motionBaseGamma = event.gamma;

    return;
  }

  const betaDelta = normalizeAngle(
    event.beta - motionBaseBeta
  );

  const gammaDelta = normalizeAngle(
    event.gamma - motionBaseGamma
  );

  let motionX = clamp(
    gammaDelta / 22,
    -1,
    1
  );

  let motionY = clamp(
    betaDelta / 22,
    -1,
    1
  );

  const screenAngle = getScreenOrientationAngle();

  let orientedX = motionX;
  let orientedY = motionY;

  if (screenAngle === 90) {
    orientedX = motionY;
    orientedY = -motionX;
  } else if (
    screenAngle === -90 ||
    screenAngle === 270
  ) {
    orientedX = -motionY;
    orientedY = motionX;
  } else if (
    screenAngle === 180 ||
    screenAngle === -180
  ) {
    orientedX = -motionX;
    orientedY = -motionY;
  }

  const amplitude = Number(
    motionAmplitude.value
  );

  targetTiltX = orientedX * amplitude;
  targetTiltY = orientedY * amplitude;
}

function enableDeviceOrientation() {
  if (deviceMotionActive) {
    return;
  }

  window.addEventListener(
    "deviceorientation",
    updateDeviceOrientation,
    true
  );

  deviceMotionActive = true;

  resetMotionCalibration();
}

async function requestDeviceOrientationPermission() {
  if (typeof window.DeviceOrientationEvent === "undefined") {
    return;
  }

  if (
    typeof window.DeviceOrientationEvent.requestPermission !== "function"
  ) {
    enableDeviceOrientation();

    return;
  }

  try {
    const permission = await window.DeviceOrientationEvent.requestPermission();

    if (permission !== "granted") {
      return;
    }

    enableDeviceOrientation();

    motionPermissionButton.classList.add(
      "hidden"
    );
  } catch (error) {
    console.error(
      "Unable to enable device motion:",
      error
    );
  }
}

function setupDeviceOrientation() {
  if (typeof window.DeviceOrientationEvent === "undefined") {
    return;
  }

  if (
    typeof window.DeviceOrientationEvent.requestPermission === "function"
  ) {
    motionPermissionButton.classList.remove(
      "hidden"
    );

    return;
  }

  enableDeviceOrientation();
}

function updatePointer(event) {
  if (!motionEnabled.checked) {
    return;
  }

  if (event.pointerType === "touch") {
    return;
  }

  const rect = stage.getBoundingClientRect();

  const pointerX = (
    event.clientX - rect.left
  ) / rect.width;

  const pointerY = (
    event.clientY - rect.top
  ) / rect.height;

  const amplitude = Number(
    motionAmplitude.value
  );

  targetTiltX = (
    (
      pointerX - 0.5
    ) *
    2.0 *
    amplitude
  );

  targetTiltY = (
    (
      pointerY - 0.5
    ) *
    2.0 *
    amplitude
  );
}

function animate() {
  const smoothingValue = Number(
    smoothing.value
  );

  tiltX += (
    targetTiltX - tiltX
  ) * smoothingValue;

  tiltY += (
    targetTiltY - tiltY
  ) * smoothingValue;

  updateTiltOutputs();
  updateCardOrientation();
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

cardImageInput.addEventListener(
  "change",
  function () {
    const file = cardImageInput.files[0];

    if (!file) {
      return;
    }

    loadCardImage(
      file
    );
  }
);

clearCardImageButton.addEventListener(
  "click",
  function () {
    clearCardImage();
  }
);

maskInput.addEventListener(
  "change",
  function () {
    const file = maskInput.files[0];

    if (!file) {
      return;
    }

    loadMask(
      file
    );
  }
);

clearMaskButton.addEventListener(
  "click",
  function () {
    clearMask();
  }
);

exportPresetButton.addEventListener(
  "click",
  function () {
    exportPreset();
  }
);

presetInput.addEventListener(
  "change",
  function () {
    const file = presetInput.files[0];

    if (!file) {
      return;
    }

    importPreset(
      file
    );
  }
);

saveLocalButton.addEventListener(
  "click",
  function () {
    saveLocalPreset();
  }
);

loadLocalButton.addEventListener(
  "click",
  function () {
    loadLocalPreset();
  }
);

resetSettingsButton.addEventListener(
  "click",
  function () {
    restoreDefaults();
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
    if (deviceMotionActive) {
      return;
    }

    targetTiltX = 0;
    targetTiltY = 0;
  }
);

motionEnabled.addEventListener(
  "change",
  function () {
    targetTiltX = 0;
    targetTiltY = 0;

    if (motionEnabled.checked) {
      resetMotionCalibration();

      return;
    }
  }
);

motionPermissionButton.addEventListener(
  "click",
  function () {
    requestDeviceOrientationPermission();
  }
);

window.addEventListener(
  "orientationchange",
  function () {
    resetMotionCalibration();
  }
);

setupDeviceOrientation();

fetchPrismCards();
animate();
