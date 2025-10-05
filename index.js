document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const yearElement = document.getElementById("year");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const spectrumSelect = document.getElementById("spectrums");
  const sphere = document.getElementById("terra-sphere");
  const startYearSelect = document.getElementById("start-year");
  const endYearSelect = document.getElementById("end-year");
  const playBtn = document.getElementById("play-animation");
  const simulateBtn = document.getElementById("simulate-btn");
  const textureCanvas = document.getElementById('dynamic-texture-canvas');
  const textureCtx = textureCanvas.getContext('2d');
  const assetsContainer = document.getElementById('image-assets');

  // --- State Variables ---
  const spectrumData = {
    modis: { minYear: 2000, maxYear: 2025, currentYear: 2000 },
    aster: { minYear: 2025, maxYear: 2025, currentYear: 2025 },
    ceres: { minYear: 2025, maxYear: 2025, currentYear: 2025 },
    misr: { minYear: 2025, maxYear: 2025, currentYear: 2025 },
    mopitt: { minYear: 2025, maxYear: 2025, currentYear: 2025 }
  };
  let currentSpectrum = spectrumSelect.value;
  let currentYear = spectrumData[currentSpectrum].currentYear;
  let animationInterval = null;

  // --- Intro Video Logic ---
  function setupIntro() {
    const introContainer = document.getElementById('intro-video-container');
    const introVideo = document.getElementById('intro-video');
    const skipBtn = document.getElementById('skip-intro-btn');

    if (!introContainer || !introVideo || !skipBtn || !sphere) return;

    sphere.setAttribute('visible', 'false');

    const finishIntro = () => {
      introVideo.removeEventListener('ended', finishIntro);
      skipBtn.removeEventListener('click', finishIntro);
      introContainer.style.opacity = '0';
      setTimeout(() => {
        introContainer.style.display = 'none';
        sphere.setAttribute('visible', 'true');
      }, 800);
    };

    const handleIntroFullscreen = () => {
      if (!document.fullscreenElement) {
        introContainer.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    };

    const handleIntroPlayback = (event) => {
      if (event.target.id !== 'skip-intro-btn') {
        introVideo.paused ? introVideo.play() : introVideo.pause();
      }
    };

    introVideo.addEventListener('ended', finishIntro);
    skipBtn.addEventListener('click', finishIntro);
    introContainer.addEventListener('dblclick', handleIntroFullscreen);
    introContainer.addEventListener('click', handleIntroPlayback);
  }

  // --- Event Handlers ---
  function handlePrevClick() {
    stopAnimation();
    if (currentYear > spectrumData[currentSpectrum].minYear) {
      currentYear--;
      updateUI();
    }
  }

  function handleNextClick() {
    stopAnimation();
    if (currentYear < spectrumData[currentSpectrum].maxYear) {
      currentYear++;
      updateUI();
    }
  }

  function handleSpectrumChange(e) {
    stopAnimation();
    currentSpectrum = e.target.value;
    currentYear = spectrumData[currentSpectrum].currentYear;
    populateYearSelectors();
    updateUI();
  }

  function handleResize() {
    adjustSphereRadius();
  }

  // --- UI Update Functions ---
  function updateUI() {
    yearElement.textContent = currentYear;
    updateSphereTexture();
    updateButtonState();
  }

    /**
     * Populates the year selectors (From/To) with the available options.
     */
    function populateYearSelectors() {
      const { minYear, maxYear } = spectrumData[currentSpectrum];
      startYearSelect.innerHTML = '';
      endYearSelect.innerHTML = '';
      for (let year = minYear; year <= maxYear; year++) {
        startYearSelect.innerHTML += `<option value="${year}">${year}</option>`;
        endYearSelect.innerHTML += `<option value="${year}">${year}</option>`;
      }
      // By default, the end year is the maximum.
      endYearSelect.value = maxYear;
    }

    /**
     * Enables or disables the year navigation buttons
     * according to the limits defined in spectrumData.
     */
    function updateButtonState() {
      const data = spectrumData[currentSpectrum];
      // The 'prev' button is disabled if the current year is the minimum.
      prevBtn.disabled = currentYear <= data.minYear;
      // The 'next' button is disabled if the current year is the maximum.
      nextBtn.disabled = currentYear >= data.maxYear;
    }

    /**
     * Updates the sphere's texture.
     * Verifies if the image exists before applying it.
     * If it doesn't exist, it applies a default texture.
     */
    function updateSphereTexture() {
      const assetId = `${currentSpectrum}-${currentYear}-texture`; // ID of the pre-loaded image
      const fallbackAssetId = 'fallback-texture'; // ID of the fallback image

      const imageToDraw = document.getElementById(assetId) || document.getElementById(fallbackAssetId);

      if (imageToDraw) {
        // We draw the pre-loaded image directly onto the canvas
        textureCtx.drawImage(imageToDraw, 0, 0, textureCanvas.width, textureCanvas.height);
        const material = sphere.getObject3D('mesh').material;
        if (material.map) {
          // We tell A-Frame that the canvas texture has changed and needs to be updated
          material.map.needsUpdate = true;
        }
      } else {
        console.error(` Error: Neither asset #${assetId} nor the fallback was found.`);
      }
    }

    /** 
     * Starts the texture animation based on the selected year range.
     */
    function playAnimation() {
      let startYear = parseInt(startYearSelect.value);
      const endYear = parseInt(endYearSelect.value);

      if (startYear > endYear) {
        alert("El año de inicio no puede ser mayor que el año final.");
        return;
      }

      playBtn.disabled = true; // Disable the button during animation
      prevBtn.disabled = true;
      nextBtn.disabled = true;

      let frameYear = startYear;
      let lastFrameTime = performance.now();
      const frameDuration = 1000; // 1000ms per image

      function animationLoop(currentTime) {
        const elapsed = currentTime - lastFrameTime;

        if (elapsed > frameDuration) {
          lastFrameTime = currentTime - (elapsed % frameDuration);

          // Update the texture only if the year has changed
          if (currentYear !== frameYear) {
            currentYear = frameYear;
            yearElement.textContent = currentYear;
            updateSphereTexture();
          }

          if (frameYear >= endYear) {
            // End of animation
            animationInterval = null;
            updateButtonState();
            playBtn.disabled = false;
            return; // Stop the loop
          }

          frameYear++;
        }

        // Continue the loop
        animationInterval = requestAnimationFrame(animationLoop);
      }

      // Start the animation loop
      animationInterval = requestAnimationFrame(animationLoop);
    }

    function stopAnimation() {
      if (animationInterval) {
        cancelAnimationFrame(animationInterval);
        animationInterval = null;
        playBtn.disabled = false;
        updateButtonState(); // Re-enable nav buttons if needed
      }
    }

    /**
     * Sends the current sphere texture to the backend simulator
     * and displays the predicted next-year texture.
     */
    async function handleSimulation() {
      stopAnimation();
      simulateBtn.disabled = true;
      simulateBtn.textContent = '🧠 Simulating...';

      // 1. Get the current image from the canvas as a Blob
      textureCanvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Could not get image from canvas.');
          simulateBtn.textContent = '🔮 Simulate Next Year';
          return;
        }

        // 2. Send the image to the FastAPI backend
        const formData = new FormData();
        formData.append('imagen', blob, 'current_year.jpg');

        try {
          // We wrap the fetch call in its own try...catch to provide a more specific error message.
          let response;
          try {
            response = await fetch('http://localhost:8000/predecir', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const imageBlob = await response.blob();
          } catch (networkError) {
            // This block catches network errors, like the server not being available.
            console.error("Network error:", networkError);
            alert("Connection to the simulation server failed. \n\nIs the Python server running in the terminal?");
            throw networkError; // Stop further execution
          }
          const imageUrl = URL.createObjectURL(imageBlob);
          const predictedImage = new Image();
          predictedImage.onload = () => {
            // 3. Draw the predicted image onto the canvas
            textureCtx.drawImage(predictedImage, 0, 0, textureCanvas.width, textureCanvas.height);
            const material = sphere.getObject3D('mesh').material;
            if (material.map) material.map.needsUpdate = true;

            // 4. Update UI to reflect the new "simulated" year
            currentYear++;
            yearElement.textContent = `${currentYear} (Simulated)`;
            updateButtonState(); // Disable 'next' if we are at max year
            simulateBtn.textContent = '🔮 Simulate Next Year';
            // Re-enable if we can simulate further
            simulateBtn.disabled = currentYear >= spectrumData[currentSpectrum].maxYear;
            URL.revokeObjectURL(imageUrl); // Clean up
          };
          predictedImage.src = imageUrl;

        } catch (error) {
          console.error("Simulation failed:", error);
          // General failure message, as the specific network error is handled above.
          simulateBtn.textContent = '🔮 Simulate Next Year';
          simulateBtn.disabled = false;
        }
      }, 'image/jpeg');
    }

    /**
     * Preloads all images for a specific spectrum in the background.
     * Adds them to the A-Frame asset system for instant switching.
     */
    function preloadSpectrumImages(spectrumName) {
      const data = spectrumData[spectrumName];
      if (!data || !assetsContainer) return;

      // We add a listener for when ALL assets have been loaded by A-Frame.
      assetsContainer.addEventListener('loaded', () => {
        console.log('✅ ¡Todos los assets han sido cargados y procesados por A-Frame!');
        // Once everything is loaded, we draw the initial texture on the canvas and enable the controls.
        const initialImage = document.getElementById(`${currentSpectrum}-${currentYear}-texture`);
        if (initialImage) {
          textureCtx.drawImage(initialImage, 0, 0, textureCanvas.width, textureCanvas.height);
        }
        populateYearSelectors();
        updateButtonState();
        playBtn.disabled = false;
        startYearSelect.disabled = false;
        endYearSelect.disabled = false;
        simulateBtn.disabled = false;
        // We show the current year, replacing the loading indicator.
        yearElement.textContent = currentYear; // Ensure the year is displayed.
      });

      console.log(`Pre-cargando imágenes para '${spectrumName}' desde ${data.minYear} hasta ${data.maxYear}...`);

      // Add the fallback image to the assets
      const fallbackImg = document.createElement('img');
      fallbackImg.id = 'fallback-texture';
      fallbackImg.src = 'imgs_modis/texture-not-found.jpg';
      assetsContainer.appendChild(fallbackImg);

      // Add all images from the range to the assets
      for (let year = data.minYear; year <= data.maxYear; year++) {
        const img = document.createElement('img');
        img.id = `${spectrumName}-${year}-texture`;
        img.src = `imgs_modis/${spectrumName}-${year}.jpg`;
        assetsContainer.appendChild(img);
      }

      // We show a "loading" state while the assets are being processed.
      yearElement.textContent = '...';
    }

    /**
     * Adjusts the sphere's radius for mobile devices.
     */
    function adjustSphereRadius() {
      const tabletBreakpoint = 1024; // Screens wider than this are considered desktop
      const mobileBreakpoint = 480;  // Screens wider than this (and up to tablet) are tablets

      const desktopRadius = 2.0;
      const tabletRadius = 1.8;  // A slightly smaller radius for tablets
      const mobileRadius = 1.4;  // A smaller radius for phones

      if (window.innerWidth <= mobileBreakpoint) {
        // Mobile
        sphere.setAttribute('radius', mobileRadius);
      } else if (window.innerWidth <= tabletBreakpoint) {
        // Tablet
        sphere.setAttribute('radius', tabletRadius);
      } else {
        // Desktop
        sphere.setAttribute('radius', desktopRadius);
      }
    }

    // --- Initialization ---
    function setupEventListeners() {
      prevBtn.addEventListener("click", handlePrevClick);
      nextBtn.addEventListener("click", handleNextClick);
      playBtn.addEventListener("click", playAnimation);
      spectrumSelect.addEventListener("change", handleSpectrumChange);
      simulateBtn.addEventListener("click", handleSimulation);
      window.addEventListener("resize", handleResize);
    }

    function init() {
      setupIntro();
      setupEventListeners();
      adjustSphereRadius(); // Initial call to set the correct size on load
      preloadSpectrumImages(currentSpectrum); // Start preloading images
    }

    init(); // Start the application

  });


  /**
     * Self-executing function to encapsulate and run the star animation
     * completely independently.
     */
    (function () {
      const starsCanvas = document.getElementById("stars");
      const starsCtx = starsCanvas.getContext("2d");
      let stars = [];

      function createAndDrawStars() {
        starsCanvas.width = window.innerWidth;
        starsCanvas.height = window.innerHeight;
        stars = []; // Reset stars on resize to avoid accumulation
        for (let i = 0; i < 150; i++) {
          stars.push({
            x: Math.random() * starsCanvas.width,
            y: Math.random() * starsCanvas.height,
            r: Math.random() * 1.5
          });
        }

        // Draw the stars once
        starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
        starsCtx.fillStyle = "white";
        starsCtx.beginPath();
        for (let s of stars) {
          starsCtx.moveTo(s.x, s.y);
          starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        }
        starsCtx.fill();
      }

      // Draws the stars on load and every time the window is resized.
      window.addEventListener("resize", createAndDrawStars);
      createAndDrawStars();
    })();