    const spectrumData = {
      // Define el rango de años y el año actual para cada espectro.
      modis: {
        minYear: 2000,
        maxYear: 2025,
        currentYear: 2000 // Empezamos en el año 2000
      },
      // Se pueden configurar los otros espectros aquí en el futuro
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

    yearElement.textContent = currentYear;

    /**
     * Habilita o deshabilita los botones de navegación de año
     * según los límites definidos en spectrumData.
     */
    function updateButtonState() {
      const data = spectrumData[currentSpectrum];
      // El botón 'prev' se deshabilita si el año actual es el mínimo.
      prevBtn.disabled = currentYear <= data.minYear;
      // El botón 'next' se deshabilita si el año actual es el máximo.
      nextBtn.disabled = currentYear >= data.maxYear;
    }



    /**
     * Actualiza la textura de la esfera.
     * Verifica si la imagen existe antes de aplicarla.
     * Si no existe, aplica una textura por defecto.
     */
    function updateSphereTexture() {
      const newTextureSrc = `imgs/${currentSpectrum}-${currentYear}.jpg`;
      const fallbackTextureSrc = 'imgs/texture-not-found.jpg'; // <-- ¡Asegúrate de tener esta imagen!

      console.log(`Intentando cargar textura: ${newTextureSrc}`);

      // Creamos un objeto de imagen en memoria para verificar si existe
      const img = new Image();
      img.src = newTextureSrc;

      img.onload = () => {
        console.log(`✅ Éxito: Textura '${newTextureSrc}' cargada y aplicada.`);
        // La imagen existe, la aplicamos a la esfera
        sphere.setAttribute('material', 'src', newTextureSrc);
      };
      img.onerror = () => {
        console.error(`❌ Error: No se encontró la imagen '${newTextureSrc}'. Aplicando textura de respaldo.`);
        // La imagen no se encontró, aplicamos la de respaldo
        sphere.setAttribute('material', 'src', fallbackTextureSrc);
      };
    }

    prevBtn.addEventListener("click", () => {
      if (currentYear > spectrumData[currentSpectrum].minYear) {
        currentYear--;
        spectrumData[currentSpectrum].currentYear = currentYear;
        yearElement.textContent = currentYear;
        updateSphereTexture();
        updateButtonState();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentYear < spectrumData[currentSpectrum].maxYear) {
        currentYear++;
        spectrumData[currentSpectrum].currentYear = currentYear;
        yearElement.textContent = currentYear;
        updateSphereTexture();
        updateButtonState();
      }
    });

    spectrumSelect.addEventListener("change", (e) => {
      currentSpectrum = e.target.value;
      currentYear = spectrumData[currentSpectrum].currentYear;
      yearElement.textContent = currentYear;
      updateSphereTexture();
      updateButtonState();
    });

    // Llamada inicial para sincronizar la esfera con el estado inicial del script
    updateSphereTexture();
    // Llamada inicial para establecer el estado correcto de los botones
    updateButtonState();

    /* ✨ Animación del fondo de estrellas */
    const canvas = document.getElementById("stars");
    const ctx = canvas.getContext("2d");
    let stars = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5,
        d: Math.random() * 1.5
      });
    }

    function drawStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.beginPath();
      for (let s of stars) {
        ctx.moveTo(s.x, s.y);
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      }
      ctx.fill();
      updateStars();
    }

    let angle = 0;
    function updateStars() {
      angle += 0.01;
      for (let s of stars) {
        s.y += Math.cos(angle + s.d) + 1 + s.r / 2;
        s.x += Math.sin(angle) * 0.3;

        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      }
    }

    function animateStars() {
      drawStars();
      requestAnimationFrame(animateStars);
    }
    animateStars();