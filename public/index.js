    /**
     * Handles the intro video playback.
     * It hides the video container once the video has finished playing.
     */
    (function handleIntroVideo() {
      const introContainer = document.getElementById('intro-video-container');
      const introVideo = document.getElementById('intro-video');
      const skipBtn = document.getElementById('skip-intro-btn');
      const body = document.body;
      const sphere = document.getElementById('terra-sphere');

      if (introContainer && introVideo && skipBtn && sphere) {
        body.classList.add('intro-active'); // Add class to hide content
        sphere.setAttribute('visible', 'false'); // Hide the planet via A-Frame

        const finishIntro = () => {
          // Remove listeners to prevent this from running twice
          introVideo.removeEventListener('ended', finishIntro);
          skipBtn.removeEventListener('click', finishIntro);

          introContainer.style.opacity = '0'; // Start fade-out
          // After the transition, hide the element and show the content
          setTimeout(() => {
            introContainer.style.display = 'none'; // Hide video container completely
            body.classList.remove('intro-active'); // Remove class to show content
            sphere.setAttribute('visible', 'true'); // Make the planet visible again
          }, 800); // Must match the transition duration in CSS
        };

        introVideo.addEventListener('ended', finishIntro);
        skipBtn.addEventListener('click', finishIntro);
      }
    })();

    const spectrumData = {
      // Defines the year range and current year for each spectrum.
      modis: {
        minYear: 2000,
        maxYear: 2025,
        currentYear: 2000 // We start in the year 2000
      },
      // Other spectrums can be configured here in the future
      aster: { minYear: 2025, maxYear: 2025, currentYear: 2025 },
      ceres: { minYear: 2025, maxYear: 2025, currentYear: 2025 },
      misr: { minYear: 2025, maxYear: 2025, currentYear: 2025 },
      mopitt: { minYear: 2025, maxYear: 2025, currentYear: 2025 }
    };

    let currentSpectrum = document.getElementById("spectrums").value;
    let currentYear = spectrumData[currentSpectrum].currentYear;

    const yearElement = document.getElementById("year");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const spectrumSelect = document.getElementById("spectrums");
    const sphere = document.getElementById("terra-sphere");
    const startYearSelect = document.getElementById("start-year");
    const endYearSelect = document.getElementById("end-year");
    const playBtn = document.getElementById("play-animation");
    const predictYearInput = document.getElementById("predict-year");

    // Get the context of the canvas we will use as a dynamic texture
    const textureCanvas = document.getElementById('dynamic-texture-canvas');
    const textureCtx = textureCanvas.getContext('2d');

    let animationInterval = null;

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
   * Updates the sphere's texture with the generated prediction image.
   */
  function updateSphereWithPrediction() {
    const predictionImage = new Image();
    // The source is the image generated by the Python script
    predictionImage.src = 'outputs/prediction_future.jpg';

    // When the image is loaded, draw it on the canvas
    predictionImage.onload = () => {
      textureCtx.drawImage(predictionImage, 0, 0, textureCanvas.width, textureCanvas.height);
      const material = sphere.getObject3D('mesh').material;
      if (material.map) {
        material.map.needsUpdate = true;
      }
      console.log('✅ Prediction texture applied to the sphere.');
    };

    predictionImage.onerror = () => console.error("❌ Error: Could not load 'outputs/prediction_future.jpg'. Did you run the prediction script?");
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

    prevBtn.addEventListener("click", () => {
      stopAnimation();
      if (currentYear > spectrumData[currentSpectrum].minYear) {
        currentYear--;
        yearElement.textContent = currentYear;
        updateSphereTexture();
        updateButtonState();
      }
    });

    nextBtn.addEventListener("click", () => {
      stopAnimation();
      if (currentYear < spectrumData[currentSpectrum].maxYear) {
        currentYear++;
        yearElement.textContent = currentYear;
        updateSphereTexture();
        updateButtonState();
      }
    });

    playBtn.addEventListener("click", playAnimation);

    predictYearInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const year = parseInt(predictYearInput.value);

        // Validate the year
        if (isNaN(year) || year < 2025 || year > 3000) {
          alert("Por favor, introduce un año válido entre 2025 y 3000.");
          predictYearInput.value = ""; // Clear the invalid input
          return;
        }

        // Stop any ongoing animation
        stopAnimation();

        // Update the application state to the predicted year
        currentYear = year;
        yearElement.textContent = `${currentYear} (Prediction)`;
        // Use the special function to load the prediction image
        updateSphereWithPrediction();
        console.log(`Displaying prediction for year: ${year}`);
      }
    });

    function stopAnimation() {
      if (animationInterval) {
        cancelAnimationFrame(animationInterval);
        animationInterval = null;
        playBtn.disabled = false;
      }
    }
    spectrumSelect.addEventListener("change", (e) => {
      currentSpectrum = e.target.value;
      populateYearSelectors();
      currentYear = spectrumData[currentSpectrum].currentYear
      updateSphereTexture()
      updateButtonState(); // <-- FIX! Update buttons when changing spectrum
      yearElement.textContent = currentYear
    });

    /**
     * Preloads all images for a specific spectrum in the background.
     * Adds them to the A-Frame asset system for instant switching.
     */
    function preloadSpectrumImages(spectrumName) {
      const assetsContainer = document.getElementById('image-assets');
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
        // We show the current year, replacing the loading indicator.
        yearElement.textContent = currentYear; // Ensure the year is displayed.
      });

      console.log(`Pre-cargando imágenes para '${spectrumName}' desde ${data.minYear} hasta ${data.maxYear}...`);
      
      // Add the fallback image to the assets
      const fallbackImg = document.createElement('img');
      fallbackImg.id = 'fallback-texture';
      fallbackImg.src = 'imgs/texture-not-found.jpg';
      assetsContainer.appendChild(fallbackImg);

      // Add all images from the range to the assets
      for (let year = data.minYear; year <= data.maxYear; year++) {
        const img = document.createElement('img');
        img.id = `${spectrumName}-${year}-texture`;
        img.src = `imgs/${spectrumName}-${year}.jpg`;
        assetsContainer.appendChild(img);
      }

      // We show a "loading" state while the assets are being processed.
      document.getElementById('year').textContent = '...';
    }

    // We preload the images for the current spectrum (MODIS) on page load.
    preloadSpectrumImages(currentSpectrum);

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

    function resize() {
      adjustSphereRadius(); // Adjust the sphere's radius on resize
    }
    window.addEventListener("resize", resize);
    resize(); // Initial call to set the correct size on load
    
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