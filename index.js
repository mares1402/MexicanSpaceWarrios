 const spectrumsYears = {
      aster: 2025,
      ceres: 2025,
      misr: 2025,
      modis: 2025,
      mopitt: 2025
    };

    let currentSpectrum = document.getElementById("spectrums").value;
    let currentYear = spectrumsYears[currentSpectrum];

    const yearElement = document.getElementById("year");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const spectrumSelect = document.getElementById("spectrums");

    yearElement.textContent = currentYear;

    prevBtn.addEventListener("click", () => {
      currentYear--;
      spectrumsYears[currentSpectrum] = currentYear;
      yearElement.textContent = currentYear;
    });

    nextBtn.addEventListener("click", () => {
      currentYear++;
      spectrumsYears[currentSpectrum] = currentYear;
      yearElement.textContent = currentYear;
    });

    spectrumSelect.addEventListener("change", (e) => {
      currentSpectrum = e.target.value;
      currentYear = spectrumsYears[currentSpectrum];
      yearElement.textContent = currentYear;
    });

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