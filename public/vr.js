    // Component to rotate an entity only when not in fullscreen/VR mode.
    AFRAME.registerComponent('conditional-rotation', {
      schema: {
        // Rotation speed in degrees per second.
        speed: { type: 'number', default: 10 }
      },

      init: function () {
        // Flag to check if we are in an immersive mode.
        this.isImmersive = false;
        const sceneEl = this.el.sceneEl;

        // Listen for scene events to update the flag.
        this.enterImmersive = () => { this.isImmersive = true; };
        this.exitImmersive = () => { this.isImmersive = false; };

        sceneEl.addEventListener('enter-vr', this.enterImmersive);
        sceneEl.addEventListener('exit-vr', this.exitImmersive);
      },

      tick: function (time, timeDelta) {
        // If we are in fullscreen/VR, do nothing.
        if (this.isImmersive) { return; }

        // Convert speed from degrees/sec to radians/ms
        const degreesPerMs = this.data.speed / 1000;
        // Calculate rotation for this frame
        const rotationY = this.el.object3D.rotation.y + (degreesPerMs * timeDelta * (Math.PI / 180));
        this.el.setAttribute('rotation', { y: THREE.MathUtils.radToDeg(rotationY) });
      }
    });