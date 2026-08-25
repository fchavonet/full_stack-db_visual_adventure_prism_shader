# Dragon Ball Visual Adventure Cards: Prism Shader

## Description

The Dragon Ball Visual Adventure Cards: Prism Shader is an open-source WebGL tool designed to recreate the holographic prism effect found on Dragon Ball Visual Adventure cards released by Bandai in the 1990s.

It uses card data and images provided by the companion [Dragon Ball Visual Adventure Cards: API](https://github.com/fchavonet/full_stack-db_visual_adventure_cards_api).

The shader reproduces the square prism pattern, metallic reflections, prismatic colors, highlights, and movement of the original cards through an interactive WebGL rendering.

Cards and their prism masks can be loaded automatically from the API, while custom card images and masks can also be imported for testing and calibration.

The project is open-source, free to use, and primarily intended as an experimental and educational tool for reproducing the visual characteristics of physical prism cards.

This project is for educational and non-commercial purposes only.

Dragon Ball and all related characters are trademarks of Akira Toriyama, Bandai, and Toei Animation.

## Objectives

- Recreate the holographic prism effect of Dragon Ball Visual Adventure cards using WebGL.
- Load prism cards and their masks automatically from the Dragon Ball Visual Adventure Cards API.
- Allow custom card images and prism masks to be imported for testing.
- Provide calibration controls for prism geometry and optical response.
- Support interactive reflections using pointer movement and mobile device orientation.
- Allow shader settings to be saved, loaded, imported, and exported as presets.
- Provide an open-source experimental tool that can later be reused in other projects.

## Tech Stack
![HTML5 badge](https://img.shields.io/badge/HTML5-e34f26?logo=html5&logoColor=white&style=for-the-badge)
![CSS3 badge](https://img.shields.io/badge/CSS3-1572b6?logo=css&logoColor=white&style=for-the-badge)
![Tailwind CSS badge](https://img.shields.io/badge/TAILWIND&nbsp;CSS-06b6d4?logo=tailwindcss&logoColor=white&style=for-the-badge)
![JavaScript badge](https://img.shields.io/badge/JAVASCRIPT-f7df1e?logo=javascript&logoColor=black&style=for-the-badge)
![JSON badge](https://img.shields.io/badge/JSON-000000?logo=json&logoColor=white&style=for-the-badge)
![WebGL badge](https://img.shields.io/badge/WEBGL-990000?logo=webgl&logoColor=white&style=for-the-badge)

## File Description

| **FILE**     | **DESCRIPTION**                                                                     |
| :----------: | ---------------------------------------------------                                 |
| `assets`     | Contains the resources required for the repository.                                 |
| `index.html` | Main interface used to select cards, import files, and configure the shader.        |
| `script.js`  | Contains API integration, WebGL rendering, prism shader logic, motion, and presets. |
| `README.md`  | The README file you are currently reading 😉.                                       |

## Installation & Usage

### Installation

1. Clone this repository:
    - Open your preferred Terminal.
    - Navigate to the directory where you want to clone the repository.
    - Run the following command:

```
git clone https://github.com/fchavonet/full_stack-db_visual_adventure_cards-prism_shader.git
```

2. Open the cloned repository.

### Usage

1. Open the `index.html` file in your web browser.

2. Select a Dragon Ball Visual Adventure card part.

3. Select a prism card from the available cards.

4. The card image and its prism mask are automatically loaded from the API when available.

5. Move the pointer over the preview to interact with the prism reflections on desktop.

6. On compatible mobile devices, enable device motion to control the reflections by tilting the device.

7. Use the card image section to import a custom JPG, PNG, or WebP image.

8. Use the prism mask section to import a custom mask:
    - Black areas disable the prism effect.
    - White areas enable the prism effect.

9. Adjust the shader using the available settings.

10. Use the debug controls to display:
    - The prism mask.
    - The prism grid.
    - The prism material without the original card image.
    
11. Save settings locally or import/export them as JSON presets.

You can also test the project online by clicking [here](https://fchavonet.github.io/full_stack-db_visual_adventure_cards-prism_shader/).

<table>
    <tr>
        <th align="center" style="text-align: center;">Desktop view</th>
        <th align="center" style="text-align: center;">Mobile view</th>
    </tr>
    <tr valign="top">
        <td align="center">
            <picture>
                <img src="" alt="Desktop Screenshot" width="100%">
            </picture>
        </td>
        <td align="center">
            <picture>
                <img src="" alt="Mobile Screenshot" width="100%">
            </picture>
        </td>
    </tr>
</table>

## What's Next?

- Continue refining the shader to better reproduce the appearance of physical prism cards.
- Improve calibration and rendering across different card scans and image resolutions.
- Improve mobile device orientation support and interaction.

## Thanks

- Special thanks to Ninjalex for his feedback on the visual fidelity of the prism effect.
- Thanks to all contributors and the Dragon Ball fan community for supporting this project.

## Author(s)

**Fabien CHAVONET**
- GitHub: [@fchavonet](https://github.com/fchavonet)
